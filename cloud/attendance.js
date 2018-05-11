Parse.Cloud.afterSave('Attendance', function(request, response) {
    var targetUser = request.object.get('user');
    var pushQuery = new Parse.Query(Parse.Installation);
    request.object.get('event').fetch().then(function (event) {
        pushQuery.equalTo('user', event.get('owner'));
        Parse.Push.send({
            where: pushQuery,
            data: {
                alert: request.object.get('message').replace('{0}', event.get('name'))
            }
        }, {
            success: function() {
                console.log('success: Parse.Push.send did send push');
            },
            error: function(e) {
                console.log('error: Parse.Push.send code: ' + e.code + ' msg: ' + e.message);
            },
            useMasterKey: true
        });
    });
});

Parse.Cloud.beforeSave('Attendance', function(request, response) {
    var Attendance = Parse.Object.extend('Attendance');
    var query = new Parse.Query(Attendance);
    // Add query filters to check for uniqueness
    request.object.get('event').fetch().then(function (event) {
        request.object.get('user').fetch().then(function (user) {
            query.equalTo('event', event);
            query.equalTo('user', user);
            query.first({useMasterKey:true}).then(function(existingObject) {
                if (existingObject) {
                    // Existing object, stop initial save
                    response.error('User already attending');
                } else {
                    // New object, let the save go through
                    response.success();
                }
            });
        });
    });
});

Parse.Cloud.define('countAttendance', function(request, response) {
    var query = new Parse.Query('Attendance');
    var event = new Parse.Object('Event');
    event.id = request.params.objectId;
    query.equalTo('event', event);
    query.count({
        success: function(count) {
            response.success(count);
        },
        error: function(error) {
            response.error('failed to count attendance');
        }
    }, {useMasterKey:true});
});

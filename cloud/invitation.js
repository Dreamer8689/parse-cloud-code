Parse.Cloud.afterSave('Invitation', function(request, response) {
    if (request.object.get('ignored') || request.object.get('accepted')) {
        response.success();
    }
    var targetUser = request.object.get('user');
    var pushQuery = new Parse.Query(Parse.Installation);
    pushQuery.equalTo('user', targetUser);
    request.object.get('event').fetch().then(function (event) {
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

Parse.Cloud.beforeSave('Invitation', function(request, response) {
    if (request.object.get('ignored') || request.object.get('accepted')) {
        response.success();
    }
    var Invitation = Parse.Object.extend('Invitation');
    var query = new Parse.Query(Invitation);
    // Add query filters to check for uniqueness
    request.object.get('event').fetch().then(function (event) {
        if (event.get('owner').id === request.user.id) {
            request.object.get('user').fetch().then(function (user) {
                query.equalTo('event', event);
                query.equalTo('user', user);
                query.first({useMasterKey:true}).then(function(existingObject) {
                    if (existingObject) {
                        // Existing object, stop initial save
                        response.error('User already invited');
                    } else {
                        // New object, let the save go through
                        response.success();
                    }
                });
            });
        } else {
            response.error('Not authorized');
        }
    });
});

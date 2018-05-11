Parse.Cloud.afterDelete("Event", function(request) {
    var Attendance = Parse.Object.extend('Attendance');
    var query = new Parse.Query(Attendance);
    query.equalTo("event", request.object);
    query.find().then(function(attendances) {
        attendances.map(function(attendance) {
            var pushQuery = new Parse.Query(Parse.Installation);
            pushQuery.equalTo('user', attendance.get('user'));
            Parse.Push.send({
                where: pushQuery,
                data: {
                    alert: request.object.get('cancelMessage').replace('{0}', request.object.get('name'))
                }
            }, {
                success: function() {
                    console.log('success: Parse.Push.send did send push');
                },
                error: function(e) {
                    console.log('error: Parse.Push.send code: ' + e.code + ' msg: ' + e.message);
                }
            }, {useMasterKey:true});
        });
        return Parse.Object.destroyAll(attendances);
    }).then(function(success) {
        // The related comments were deleted
    }, function(error) {
        console.error("Error deleting related attendance " + error.code + ": " + error.message);
    });
});

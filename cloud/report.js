// Parse.Cloud.afterSave('Report', function(request, response) {
//         if (request.object.get('ignored') || request.object.get('accepted')) {
//             response.success();
//         }
//         var targetUser = request.object.get('user');
//         var pushQuery = new Parse.Query(Parse.Installation);
//         pushQuery.equalTo('user', targetUser);
//         request.object.get('event').fetch().then(function (event) {
//             Parse.Push.send({
//                 where: pushQuery,
//                 data: {
//                     alert: request.object.get('message').replace('{0}', event.get('name'))
//                 }
//             }, {
//                 success: function() {
//                     console.log('success: Parse.Push.send did send push');
//                 },
//                 error: function(e) {
//                     console.log('error: Parse.Push.send code: ' + e.code + ' msg: ' + e.message);
//                 },
//                 useMasterKey: true
//             });
//         });
// });

Parse.Cloud.beforeSave('Report', function(request, response) {
    if (request.object.get('verified')) {
        response.success();
    }
    var Report = Parse.Object.extend('Report');
    var query = new Parse.Query(Report);
    // Add query filters to check for uniqueness
    request.object.get('event').fetch().then(function (event) {
        request.object.get('reportedBy').fetch().then(function (user) {
            query.equalTo('event', event);
            query.equalTo('reportedBy', user);
            query.first({useMasterKey:true}).then(function(existingObject) {
                if (existingObject) {
                    // Existing object, stop initial save
                    response.error('eventAlreadyReported');
                } else {
                    // New object, let the save go through
                    response.success();
                }
            });
        });
    });
});

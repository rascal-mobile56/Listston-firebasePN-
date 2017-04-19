// https://github.com/fechanique/cordova-plugin-fcm

document.addEventListener('deviceready', FCM_start, false);

var onTokenRefreshCallback;
var Token;

export function onTokenRefresh(fn){
    onTokenRefreshCallback = fn;
    onTokenRefreshCallback(Token||null);
}


var onNotificationCallback;
var _last_data;

export function onNotification(fn){
    onNotificationCallback = fn;
    if(_last_data)onNotificationCallback(_last_data);
}

function FCM_start () {


    // Receiving Token Refresh
    //FCMPlugin.onTokenRefresh( onTokenRefreshCallback(token) );
    //Note that this callback will be fired everytime a new token is generated, including the first time.
    FCMPlugin.onTokenRefresh(function(token){
        Token = token;
        if(onTokenRefreshCallback)onTokenRefreshCallback(token);
    });



    // Get token
    //FCMPlugin.getToken( successCallback(token), errorCallback(err) );
    //Keep in mind the function will return null if the token has not been established yet.
    // FCMPlugin.getToken(function(token){
    //     console.log(token);
    // });


    // Subscribe to topic
    //FCMPlugin.subscribeToTopic( topic, successCallback(msg), errorCallback(err) );
    //All devices are subscribed automatically to 'all' and 'ios' or 'android' topic respectively.
    //Must match the following regular expression: "[a-zA-Z0-9-_.~%]{1,900}".

    // FCMPlugin.subscribeToTopic('topicExample');


    // Unsubscribe from topic
    //FCMPlugin.unsubscribeFromTopic( topic, successCallback(msg), errorCallback(err) );

    // FCMPlugin.unsubscribeFromTopic('topicExample');


    // Receiving push notification data
    //FCMPlugin.onNotification( onNotificationCallback(data), successCallback(msg), errorCallback(err) )
    //Here you define your application behaviour based on the notification data.


    FCMPlugin.onNotification(function(data){
        _last_data = data;
        if(onNotificationCallback)onNotificationCallback(data);
        if(data.wasTapped){
          //Notification was received on device tray and tapped by the user.
        }else{
          //Notification was received in foreground. Maybe the user needs to be notified.
        }
    });

}//FCM_start
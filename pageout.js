//var default_incident_summary = "Please help with an incident";

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getHashParameterByName(name, isHash) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function generateRandomState(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';

    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;

}

function requestOAuthToken() {
    var state = generateRandomState(16);
    window.localStorage.setItem('pdClientState', state);
    var clientId = "cce46eeac88f5d9195501368d47b71444dbeff04d74ae4df804b61c6f64d7517";
    var redirectUri = "https://lisa-yang12.github.io/";
    var oauthRoute = "https://app.pagerduty.com/oauth/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUri + "&response_type=token&state=" + state;
    window.location.href = oauthRoute;
}

function getOAuthResponseParams() {
    var oauthParams = {};
    var token = getHashParameterByName('access_token');
    if (token) oauthParams.token = token;
    var state = getHashParameterByName('state');
    if (state) oauthParams.state = state;

    window.location.hash = '';

    return oauthParams;
}

function receiveOAuthToken(oauthParams) {
    var state = window.localStorage.getItem('pdClientState');
    if (oauthParams.state !== state) {
        alert("ERROR: OAuth failed due to bad state. Can't access PagerDuty API without OAuth");
        return;
    }
    window.localStorage.setItem('pdOAuthToken', oauthParams.token);
}

function removeOAuthToken() {
    window.localStorage.removeItem('pdOAuthToken');
    window.localStorage.removeItem('pdClientState');
}

function getToken() {
    return window.localStorage.getItem('pdOAuthToken');
}

/*//grab incident ID from URL and regEx out
function getIncidentID(){
var r = /\/incidents\/([\w]+)\//;
var url = r.exec(window.top.location.href)[1];
console.log("incident id " + url);
    return url
} */

function getIncidentID(){
//console.log("location.search "+ location.search);
//console.log("document.referrer " + document.referrer);
//console.log("document.location.href "+ document.location.href);
var url = (window.location != window.parent.location)
            ? document.referrer
            : document.location.href;
var regEx = /incidents\/(.*)/;
var output = regEx.exec(url)[1];
var id = output.split('/');
 console.log("incident id " + id[0]);
 return id[0];
}

function PDRequest(token, endpoint, method, options) {
    var from = getFromHeader();
    var merged = $.extend(true, {}, {
            type: method,
            //dataType: "json",
            url: "https://api.pagerduty.com/" + endpoint,
            headers: {
                "Authorization": "Bearer " + token,
                "Accept": "application/vnd.pagerduty+json;version=2",
                "From": from, //needs to be more dynamic
                "Content-Type": "application/json"
            },
            error: function(err, textStatus) {
            	console.log(err);
            }
        },
        options);

    $.ajax(merged);
}

function fetch(token, endpoint, params, callback, progressCallback) {
    var limit = 100;
    var infoFns = [];
    var fetchedData = [];

    var commonParams = {
        total: true,
        limit: limit
    };

    var getParams = $.extend(true, {}, params, commonParams);

    var options = {
        data: getParams,
        success: function(data) {
            var total = data.total;
            Array.prototype.push.apply(fetchedData, data[endpoint]);

            if (data.more == true) {
                var indexes = [];
                for (i = limit; i < total; i += limit) {
                    indexes.push(Number(i));
                }
                indexes.forEach(function(i) {
                    var offset = i;
                    infoFns.push(function(callback) {
                        var options = {
                            data: $.extend(true, { offset: offset }, getParams),
                            success: function(data) {
                                Array.prototype.push.apply(fetchedData, data[endpoint]);
                                if (progressCallback) {
                                    progressCallback(data.total, fetchedData.length);
                                }
                                callback(null, data);
                            }
                        }
                        PDRequest(token, endpoint, "GET", options);
                    });
                });

                async.parallel(infoFns, function(err, results) {
                    callback(fetchedData);
                });
            } else {
                callback(fetchedData);
            }
        }
    }
    PDRequest(token, endpoint, "GET", options);
}

function populateUserSelect() {
    var token = getToken();
    fetch(token, 'users', null, function(data) {
        data.forEach(function(user) {
            $('#user-select').append($('<option/>', {
                value: user.id,
                text: user.summary
            }));
        });
    });
}

function populateServiceSelect() {
    var token = getToken();
    fetch(token, 'services', null, function(data) {
        data.forEach(function(service) {
            $('#service-select').append($('<option/>', {
                value: service.id,
                text: service.summary
            }));
        });
    });
}

function getFromHeader(){
var token = getToken();
var endpoint = 'users/me';
var method = 'GET'
var from = "";
   var options = {
        contentType: "application/json",
        data: JSON.stringify(body),
        success: function(data) {
            from.append(data.email);
            console.log(data);
        },
        error: function(data) {//var default_incident_summary = "Please help with an incident";

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getHashParameterByName(name, isHash) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function generateRandomState(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';

    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;

}

function requestOAuthToken() {
    var state = generateRandomState(16);
    window.localStorage.setItem('pdClientState', state);
    var clientId = "cce46eeac88f5d9195501368d47b71444dbeff04d74ae4df804b61c6f64d7517";
    var redirectUri = "https://lisa-yang12.github.io/";
    var oauthRoute = "https://app.pagerduty.com/oauth/authorize?client_id=" + clientId + "&redirect_uri=" + redirectUri + "&response_type=token&state=" + state;
    window.location.href = oauthRoute;
}

function getOAuthResponseParams() {
    var oauthParams = {};
    var token = getHashParameterByName('access_token');
    if (token) oauthParams.token = token;
    var state = getHashParameterByName('state');
    if (state) oauthParams.state = state;

    window.location.hash = '';

    return oauthParams;
}

function receiveOAuthToken(oauthParams) {
    var state = window.localStorage.getItem('pdClientState');
    if (oauthParams.state !== state) {
        alert("ERROR: OAuth failed due to bad state. Can't access PagerDuty API without OAuth");
        return;
    }
    window.localStorage.setItem('pdOAuthToken', oauthParams.token);
}

function removeOAuthToken() {
    window.localStorage.removeItem('pdOAuthToken');
    window.localStorage.removeItem('pdClientState');
}

function getToken() {
    return window.localStorage.getItem('pdOAuthToken');
}

/*//grab incident ID from URL and regEx out
function getIncidentID(){
var r = /\/incidents\/([\w]+)\//;
var url = r.exec(window.top.location.href)[1];
console.log("incident id " + url);
    return url
} */

function getIncidentID(){
//console.log("location.search "+ location.search);
//console.log("document.referrer " + document.referrer);
//console.log("document.location.href "+ document.location.href);
var url = (window.location != window.parent.location)
            ? document.referrer
            : document.location.href;
var regEx = /incidents\/(.*)/;
var output = regEx.exec(url)[1];
var id = output.split('/');
 console.log("incident id " + id[0]);
 return id[0];
}

function PDRequest(token, endpoint, method, options) {
    var from = getFromHeader();
    var merged = $.extend(true, {}, {
            type: method,
            //dataType: "json",
            url: "https://api.pagerduty.com/" + endpoint,
            headers: {
                "Authorization": "Bearer " + token,
                "Accept": "application/vnd.pagerduty+json;version=2",
                "From": from, //needs to be more dynamic
                "Content-Type": "application/json"
            },
            error: function(err, textStatus) {
            	console.log(err);
            }
        },
        options);

    $.ajax(merged);
}

function fetch(token, endpoint, params, callback, progressCallback) {
    var limit = 100;
    var infoFns = [];
    var fetchedData = [];

    var commonParams = {
        total: true,
        limit: limit
    };

    var getParams = $.extend(true, {}, params, commonParams);

    var options = {
        data: getParams,
        success: function(data) {
            var total = data.total;
            Array.prototype.push.apply(fetchedData, data[endpoint]);

            if (data.more == true) {
                var indexes = [];
                for (i = limit; i < total; i += limit) {
                    indexes.push(Number(i));
                }
                indexes.forEach(function(i) {
                    var offset = i;
                    infoFns.push(function(callback) {
                        var options = {
                            data: $.extend(true, { offset: offset }, getParams),
                            success: function(data) {
                                Array.prototype.push.apply(fetchedData, data[endpoint]);
                                if (progressCallback) {
                                    progressCallback(data.total, fetchedData.length);
                                }
                                callback(null, data);
                            }
                        }
                        PDRequest(token, endpoint, "GET", options);
                    });
                });

                async.parallel(infoFns, function(err, results) {
                    callback(fetchedData);
                });
            } else {
                callback(fetchedData);
            }
        }
    }
    PDRequest(token, endpoint, "GET", options);
}

function populateUserSelect() {
    var token = getToken();
    fetch(token, 'users', null, function(data) {
        data.forEach(function(user) {
            $('#user-select').append($('<option/>', {
                value: user.id,
                text: user.summary
            }));
        });
    });
}

function populateServiceSelect() {
    var token = getToken();
    fetch(token, 'services', null, function(data) {
        data.forEach(function(service) {
            $('#service-select').append($('<option/>', {
                value: service.id,
                text: service.summary
            }));
        });
    });
}

function getFromHeader(){
var token = getToken();
var endpoint = 'users/me';
var method = 'GET'
var from = "";
   var options = {
        contentType: "application/json",
        data: JSON.stringify(body),
        success: function(data) {
            from.append(data.email);
            console.log(data);
        },
        error: function(data) {
            console.log("Error creating note<br>");
        }
   
}
    PDRequest(token, endpoint, method, options);
   }

function resolveIncident() {
    var token = getToken();
    var incidentID = getIncidentID();
    console.log(incidentID);
    var change = $('#change-select').val();
    console.log(change);
    var service = $('#ci-select').val();
    console.log(service);
    var problem = $('#problem-select').val();
    console.log(problem);
    /*var content = {
            "change": change,
            "service": service,
            "problem": problem
            }; */
    var body = {
        "note": {
            "content": "{Problem: " + problem + ", service: " + service + ", change: " + change + "}"
        }
    };

    var options = {
        contentType: "application/json",
        data: JSON.stringify(body),
        success: function(data) {
            $('#result').append('Resolution Note created');
            console.log(data);
        },
        error: function(data) {
            $('#result').append("Error creating note<br>");
            $('#result').append(data);
        }
    }

    PDRequest(token, 'incidents/'+ incidentID + '/notes', 'POST', options)
}

function main() {
    $('#login').click(function(e) {
        requestOAuthToken();
    });
    $('#logout').click(function(e) {
        removeOAuthToken();
        $('#login').show();
        $('#logout').hide();
        $('#content').hide();
        $('.busy').hide();
    });

    if (!getToken()) {
        var oauthResponseParams = getOAuthResponseParams();
        if (!oauthResponseParams.token && !oauthResponseParams.state) {
            // normal page load - when a user visits the addon page
            $('#content').hide();
            $('.busy').hide();
            $('#logout').hide();
            return;
        } else {
            // page load when being redirected from PagerDuty OAuth service
            receiveOAuthToken(oauthResponseParams);

            $('#content').show();
            $('#logout').show();
            $('#login').hide();
        }
    }

    $('#login').hide();

    //$('#incident-text').attr("placeholder", default_incident_summary);
    //populateUserSelect();
    //populateServiceSelect();
    try {
    console.log(location.search);
    console.log(document.referrer);
    console.log(document.location.href);
    console.log(window.location.href);
    console.log(window.parent.location.href);    
} catch(e) {
        console.log(e);
}
    
    $('#go').click(resolveIncident);
}

$(document).ready(main);

            console.log("Error creating note<br>");
        }
    PDRequest(token, endpoint, method, options);
}

function resolveIncident() {
    var token = getToken();
    var incidentID = getIncidentID();
    console.log(incidentID);
    var change = $('#change-select').val();
    console.log(change);
    var service = $('#ci-select').val();
    console.log(service);
    var problem = $('#problem-select').val();
    console.log(problem);
    /*var content = {
            "change": change,
            "service": service,
            "problem": problem
            }; */
    var body = {
        "note": {
            "content": "{Problem: " + problem + ", service: " + service + ", change: " + change + "}"
        }
    };

    var options = {
        contentType: "application/json",
        data: JSON.stringify(body),
        success: function(data) {
            $('#result').append('Resolution Note created');
            console.log(data);
        },
        error: function(data) {
            $('#result').append("Error creating note<br>");
            $('#result').append(data);
        }
    }

    PDRequest(token, 'incidents/'+ incidentID + '/notes', 'POST', options)
}

function main() {
    $('#login').click(function(e) {
        requestOAuthToken();
    });
    $('#logout').click(function(e) {
        removeOAuthToken();
        $('#login').show();
        $('#logout').hide();
        $('#content').hide();
        $('.busy').hide();
    });

    if (!getToken()) {
        var oauthResponseParams = getOAuthResponseParams();
        if (!oauthResponseParams.token && !oauthResponseParams.state) {
            // normal page load - when a user visits the addon page
            $('#content').hide();
            $('.busy').hide();
            $('#logout').hide();
            return;
        } else {
            // page load when being redirected from PagerDuty OAuth service
            receiveOAuthToken(oauthResponseParams);

            $('#content').show();
            $('#logout').show();
            $('#login').hide();
        }
    }

    $('#login').hide();

    //$('#incident-text').attr("placeholder", default_incident_summary);
    //populateUserSelect();
    //populateServiceSelect();
    try {
    console.log(location.search);
    console.log(document.referrer);
    console.log(document.location.href);
    console.log(window.location.href);
    console.log(window.parent.location.href);    
} catch(e) {
        console.log(e);
}
    
    $('#go').click(resolveIncident);
}

$(document).ready(main);

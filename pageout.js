function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
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
    window.localStorage.setItem('pdvisClientState', state);
    var clientId = "36020773f6d2beb61da826d31c4ac7ed9c761ed112e3282b56070013df8d8498";
    var redirectUri = "https://martindstone.github.io/PDsimplepageout/index.html";
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
    var state = window.localStorage.getItem('pdvisClientState');
    if (oauthParams.state !== state) {
        alert("ERROR: OAuth failed due to bad state. Can't access PagerDuty API without OAuth");
        return;
    }
    window.localStorage.setItem('pdvisOAuthToken', oauthParams.token);
}

function removeOAuthToken() {
    window.localStorage.removeItem('pdvisOAuthToken');
    window.localStorage.removeItem('pdvisClientState');
}

function getToken() {
    return window.localStorage.getItem('pdvisOAuthToken');
}

function PDRequest(token, endpoint, method, options) {

    var merged = $.extend(true, {}, {
            type: method,
            dataType: "json",
            url: "https://api.pagerduty.com/" + endpoint,
            headers: {
                "Authorization": "Token token=" + token,
                "Accept": "application/vnd.pagerduty+json;version=2"
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

// function populateEPSelect() {
//     var token = $('#pd_token').val();
//     fetch(token, 'escalation_policies', null, function(data) {
//         data.forEach(function(ep) {
//             $('#ep-select').append($('<option/>', {
//                 value: ep.id,
//                 text: ep.summary
//             }));
//         });
//     });
// }

// function populateAGSelect() {
// 	var snow_user = $('#snow_admin_user').val();
// 	var snow_pass = $('#snow_admin_pass').val();
// 	var snow_host = $('#snow_host').val();

// 	var hash = btoa(`${snow_user}:${snow_pass}`);
// 	console.log(`${snow_user}:${snow_pass} ${snow_host} ${hash} ${atob(hash)}`);
// 	var options = {
// 		type: 'GET',
// 		url: `https://cors-anywhere.herokuapp.com/https://${snow_host}.service-now.com/api/now/table/sys_user_group`,
// 		headers: {
// 			'Authorization': `Basic ${hash}`,
// 			'Accept': 'application/json'
// 		},
// 		success: function(data) {
// 			console.log(data);
// 			data.result.sort(function(a, b) {
// 				return a.name.localeCompare(b.name);
// 			});
// 			data.result.forEach(function(ag) {
// 				$('#ag-select').append($('<option/>', {
// 					value: ag.sys_id,
// 					text: ag.name
// 				}));
// 			});
// 		},
// 		error: function(err) {
// 			console.log(err)
// 		}
// 	}

// 	$.ajax(options);
// }

function main() {
    
    $('#login').click(function(e) {
        requestOAuthToken();
    });
    $('#logout').click(function(e) {
        removeOAuthToken();
        $('#login').show();
        $('#logout').hide();
        $('#addon-content').hide();
        $('.busy').hide();
    });

    if (!getToken()) {
        var oauthResponseParams = getOAuthResponseParams();
        if (!oauthResponseParams.token && !oauthResponseParams.state) {
            // normal page load - when a user visits the addon page
            $('#addon-content').hide();
            $('.busy').hide();
            $('#logout').hide();
            return;
        } else {
            // page load when being redirected from PagerDuty OAuth service
            receiveOAuthToken(oauthResponseParams);

            $('#addon-content').show();
            $('#logout').show();
            $('#login').hide();
        }
    }
}

$(document).ready(main);
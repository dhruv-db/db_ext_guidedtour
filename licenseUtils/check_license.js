define(['jquery', './check_license_context'], function ($, checkLicenseContext) {

    const s = "\x39\x39\x39\x39-\x31\x32-\x33\x30";
    const r = 'unlimited';


    function hx(s) { // creates a hash (integer) from a given string s
        var x = 0;
        for (var j = 0; j < s.length; j++) {
            x = ((x << 5) - x) + s.charCodeAt(j)
            x |= 0;
        }
        return Math.abs(x);
    }

    function hm(h, e) {  // creates a hashstring from hostname h and extension name e
        const o = hx(h);
        const u = hx(e);
        var cmap = [];
        var n;
        var i;
        for (n = 0; n < h.length; n++) for (i = 11; i <= 36; i++) if (cmap.length < 0x130)
            cmap.push((Math.E.toString().substr(2, 8) * h.charCodeAt(n) + o + u).toString(i));
        return cmap.join('');
    }


    function isvl(l, c, h, e, ch) {
        // function isvl = is valid license
        // provide function with 
        // l = license# 
        // c = checksum#
        // h = hostname (as in license, maybe with wildcard)
        // e = extension name
        // ch = checkfor hostname or appid

        var ret = {
            extension: e,
            hostname: h,
            applicable: null,
            license: l,
            checksum: c,
            valid: false,
            message: ""
        };

        function escapeRegex(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters for regex
        }

        if (l && c) {
            const mx = hm(h, e);
            // console.log('hashmap length', mx.length);
            const p = Math.sqrt(parseInt(c, 8) - 0x6AC);
            const mm = (p / 2 - 0x32) % 12;
            var expiry = new Date(p < 0x64 ? 0x270f : (0x7e6 + Math.floor((p - 1e2) / 24)),
                p >= 1e2 ? Math.floor(mm) : 11, p < 1e2 ? 0x1e : (mm % 1 * 30)) * 1;
            expiry += 0x5265BFF;

            ret.expiry = new Date(expiry).toISOString().slice(0, 10).replace(s, r);
            ret.licenseOk = mx.substr(p || 1e6, 7) == (l * 1).toString(36).padStart(7, '0');
            ret.expired = Date.now() > expiry;
            if (ch) {
                const regexPattern = new RegExp("^" + h.split('*').map(escapeRegex).join('.*') + "$");
                ret.applicable = regexPattern.test(ch);
            }
        }
        if (ret.licenseOk && !ret.expired) {
            if (ch) {
                if (ret.applicable) {
                    ret.message = 'License is valid and applicable';
                    ret.valid = true
                } else {
                    ret.message = 'License is valid but not applicable';
                }
            } else {
                ret.message = 'License is valid';
                ret.valid = true
            }
        } else if (ret.licenseOk) {
            if (ch) {
                if (ret.applicable) {
                    ret.message = 'License is applicable but has expired';
                } else {
                    ret.message = 'License is not applicable and has expired';
                }
            } else {
                ret.message = 'License has expired';
            }
        } else {
            ret.message = 'License is invalid';
        }
        return ret;
    }

    function vl(lj, e, ch, ai) {
        // function "vl" (is valid license)
        // parameter lj = License-JSON, 
        // e = extension name (optional, if null then all extension names in Json will be checked)
        // ch = check for this hostname
        // ai = check for this appId (optional)

        var ret = { details: [], summary: false };

        for (lje in lj) {
            if (e ? (e == lje) : true) {
                // console.log('licenses for this extension: ', lj[lje]);
                for (ljh in lj[lje]) {
                    const l = lj[lje][ljh].split(';')[0]
                    const c = lj[lje][ljh].split(';')[1]
                    const x1 = isvl(l, c, ljh, e || lje, ch);
                    if (x1.valid) {
                        ret.details.push(x1);
                        ret.summary = true
                    } else {
                        if (ai) {
                            const x2 = isvl(l, c, ljh, e || lje, ai);
                            ret.details.push(x2);
                            ret.summary = ret.summary || x2.valid;
                        } else {
                            ret.details.push(x1);
                            ret.summary = ret.summary || x1.valid;
                        }
                    }
                }
            }
        }
        return ret;
    }

    return {

        vlt: function (lj, ch, ai) {
            // function "valid license" for this extension, same as vl but it gets the extensionName from check_license_context.js
            // parameters: 
            // * lj = License-JSON, 
            // * ch = check for this hostname
            // * ai = check for this appId (optional)
            return vl(lj, checkLicenseContext.thisExtension, ch, ai);
        },


        luiMsg: function (ownId, title, result, close, width, showExtensionName) {
            // This html was found on https://qlik-oss.github.io/leonardo-ui/dialog.html
            if ($('#msgparent_' + ownId).length > 0) $('#msgparent_' + ownId).remove();

            var html = `
                <div id="msgparent_${ownId}">
                    <div class="lui-modal-background"></div>
                    <div class="lui-dialog" style="width:${width};top:80px;">
                        <div class="lui-dialog__header">
                            <div class="lui-dialog__title">${title}</div>
                        </div>
                        <div class="lui-dialog__body">
                            <table>
                                <tr style="height:24pt; border-bottom: 1px solid #bbb;">`;
            if (showExtensionName) {
                html += `           <th style="text-align:left;">Extension</th>`;
            }
            html += `               <th style="text-align:left;">Domain</th>
                                    <th style="text-align:left;">License No.</th>
                                    <th style="text-align:left;">CheckSum</th>
                                    <th style="text-align:left;">Expires</th>
                                    <th style="text-align:left;">Valid?</th>
                                </tr>`;

            for (vle of result.details) {
                html += `       <tr style="height:24pt;">`
                if (showExtensionName) {
                    html += `       <td>${vle.extension}</td>`;
                }
                html += `           <td>${vle.hostname}</td>
                                    <td>${vle.license}${vle.licenseOk ? '' : '\u26A0\uFE0F'}</td>
                                    <td>${vle.checksum}</td>
                                    <td>${vle.expiry}${vle.expired ? '\u26A0\uFE0F' : ''}</td>
                                    <td><p title="${vle.message}">${vle.valid ? '\u{1F7E2}Y' : '\u{1F534}N'}</p></td>
                                </tr>`;
            }
            html += `       </table>`;
            if (!showExtensionName) {
                html += `    <br>
                            <p>Summary: ${result.summary ? '\u{1F7E2} You have ' : '\u{1F534} Don\'t have '} a valid license</p>`;
            }
            html += `   </div>
                        <div class="lui-dialog__footer">
                            <button class="lui-button  lui-dialog__button"  
                                onclick="$(\'#msgparent_${ownId}\').remove();">${close}</button>
                        </div>
                    </div>
                </div>`;

            $("#qs-page-container").append(html);
            // fix for Qlik Sense > July 2021, the dialog gets rendered below the visible part of the screen
            if ($('#msgparent_' + ownId + ' .lui-dialog').position().top > 81) {
                $('#msgparent_' + ownId + ' .lui-dialog').css({
                    'top': (-$('#msgparent_' + ownId + ' .lui-dialog').position().top + 130) + 'px'
                });
            }
        },

        luiErr: function (ownId, title, message, close, width) {
            // This html was found on https://qlik-oss.github.io/leonardo-ui/dialog.html
            if ($('#msgparent_' + ownId).length > 0) $('#msgparent_' + ownId).remove();

            var html = `
                <div id="msgparent_${ownId}">
                    <div class="lui-modal-background"></div>
                    <div class="lui-dialog" style="width:${width};top:80px;">
                        <div class="lui-dialog__header">
                            <div class="lui-dialog__title">${title}</div>
                        </div>
                        <div class="lui-dialog__body">
                            <p>${message}</p>
                        </div>
                        <div class="lui-dialog__footer">
                            <button class="lui-button  lui-dialog__button"  
                                onclick="$(\'#msgparent_${ownId}\').remove();">${close}</button>
                        </div>
                    </div>
                </div>`;

            $("#qs-page-container").append(html);
            // fix for Qlik Sense > July 2021, the dialog gets rendered below the visible part of the screen
            if ($('#msgparent_' + ownId + ' .lui-dialog').position().top > 81) {
                $('#msgparent_' + ownId + ' .lui-dialog').css({
                    'top': (-$('#msgparent_' + ownId + ' .lui-dialog').position().top + 130) + 'px'
                });
            }
        },

        gitoqlokObjects: function (app) {

            function getMetaDataObj() {
                return new Promise((resolve, reject) => {
                    app.getObject('_gitoqlikMetaData')
                        .then((obj) => {
                            obj.getFullPropertyTree().then((fullProps) => {
                                console.log('fullProps', fullProps.qProperty);
                                //const ret = fullProps.qProperty._data.guidedtourData ? fullProps.qProperty._data.guidedtourData.licenseData : {};
                                const ret = fullProps.qProperty._data;
                                if (ret.guidedtourData) {
                                    console.log('gitoqlok meta-data object contains Guided Tour license', ret.guidedtourData);
                                }
                                resolve(fullProps.qProperty._data);
                            })
                        })
                        .catch((err) => {
                            resolve({});
                        })
                })
            }

            function getVariable() {
                return new Promise((resolve, reject) => {
                    app.variable.getContent('_gitoqlokMetaData_variable')
                        .then((content) => {
                            const ret = JSON.parse(content.qContent.qString);
                            if (ret.guidedtourData) {
                                console.log('gitoqlok variable contains Guided Tour license', ret.guidedtourData);
                            }
                            resolve(ret);
                        })
                        .catch((err) => {
                            resolve({});
                        })
                })
            }

            return Promise.all([getMetaDataObj(), getVariable()]);
        },

        getLatestGitoqlokLic: function (gitoqlokObjArr) {
            // returns the latest license data from an array of two gitoqlok objects, based on the updatedAt property
            // console.log('getLatestGitoqlokLic', gitoqlokObjArr);
            if (!Array.isArray(gitoqlokObjArr) || gitoqlokObjArr.length != 2) {
                return {};
            }
            if ((gitoqlokObjArr[0].updatedAt || 0) > (gitoqlokObjArr[1].updatedAt || 0)) {
                return gitoqlokObjArr[0].guidedtourData ? gitoqlokObjArr[0].guidedtourData.licenseData : {};
            } else {
                return gitoqlokObjArr[1].guidedtourData ? gitoqlokObjArr[1].guidedtourData.licenseData : {};
            }
        }

    }
})

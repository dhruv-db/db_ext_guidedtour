define(["qlik", "jquery", "./functions"], function
    (qlik, $, functions) {
    var pickList = [];
    var pickList2 = [];
    const bgColorPickers = "#079B4A";
    //const bgColorPickers2 = "#9B4A07";
    function divPICK(classes, label) {
        return `<div 
     style="position:absolute; z-index:100; background-color:${bgColorPickers}; 
     cursor:pointer; color:white; border-radius: 10px; padding: 0 10px;height: 20px; line-height:20px;" 
     class="${classes}">${label}</div>`;
    }


    /*
        //=============================================================================================
        async function doAjax(method, url, ownId, httpHeader, body) {
            //=========================================================================================
    
            let result;
            try {
                // if the url doesn't contain querystring "xrfkey" add it.
                if (url.indexOf('xrfkey') == -1) {
                    url += (url.indexOf('?') == -1 ? '?xrfkey=' : '&xrfkey=') + Math.random().toString().substr(2).repeat(8).substr(0, 16);
                }
                var args = {
                    timeout: 0,
                    method: method,
                    url: url,
                    headers: httpHeader
                };
                if (body) args.data = body;
                // set querystring xrfkey also as http-request-header X-Qlik-Xrfkey
                args.headers["X-Qlik-Xrfkey"] = url.split('xrfkey=')[1].substr(0, 16);
                // if method isn't GET then set Content-Type in http-request-header 
                if (method.toUpperCase() != 'GET') args.headers["Content-Type"] = 'application/json';
                console.log('$.ajax request', args);
                result = await $.ajax(args);
                console.log('$.ajax response', result);
                return result || ''; // return empty string instead of undefined
            } catch (error) {
                functions.leonardoMsg(ownId, 'Error', error.status + ' ' + error.responseText, null, 'Close', true);
                console.log('error', error.status + ' ' + error.responseText);
                return ({ "error": true, "info": error });
            }
        }
    */

    return {
        // pick: function (ownId, enigma, guided_tour_global) {

        //     const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
        //     var lastObjId;

        //     $(".guided-tour-picker").remove(); // remove previous divs

        //     $(".cell")
        //         .not(`[tid="${ownId}"]`)
        //         .find(".qv-inner-object")
        //         .each(function (i, e) {
        //             // add divs overlaying every Sense object
        //             // console.log(i, this.parentElement);
        //             // if the element is a container, skip it
        //             if (
        //                 this.parentElement.attributes["tid"] &&
        //                 this.parentElement.attributes["tid"].value != "qv-object-container"
        //             ) {
        //                 $(this)
        //                     .prepend(divPICK('guided-tour-picker', 'PICK'));
        //             }
        //         });

        //     // if an element inside a container was selected above (now has a PICK div), remove it again
        //     $(".cell .qv-object-container .guided-tour-picker").remove();

        //     // special care of container objects, add picker per tab (li-tag)
        //     $(".cell .qv-object-container li")
        //         .prepend(divPICK("guided-tour-picker-container", 'PICK'));
        //     // '[tid="sHAKJp"] .guided-tour-picker'
        //     function addToList(objId, tidOrCss) {
        //         console.log(ownId, "Picked object Id " + objId);
        //         lastObjId = objId;


        //         // multi-select-mode 
        //         pickList.push(objId);
        //         pickList2.push(objId);
        //         if (tidOrCss == "tid") {
        //             enigma.getObject(objId).then(function (obj) {
        //                 pickList[pickList.length - 1] += `,"${obj.layout.visualization} ${obj.layout.title}"`;
        //             });
        //         } else {  // clicked of div which is over a container tab
        //             pickList[pickList.length - 1] += ',"container tab ' + $(`${objId} .lui-tab__text`).text() + '"';
        //         }
        //         // highlight for some milliseconds the currently clicked picker and the DONE picker
        //         const currPicker = tidOrCss == "tid"
        //             ? `[tid="${objId}"] .guided-tour-picker`
        //             : `${objId} .guided-tour-picker-container`;
        //         $(currPicker).css("background-color", "orange");
        //         $(`[tid="${ownId}"] .guided-tour-picker`).css("background-color", "orange");
        //         $(`[tid="${ownId}"] .guided-tour-picks`).html(
        //             "(" + pickList.length + ")"
        //         );
        //         setTimeout(function () {
        //             $(currPicker).css("background-color", bgColorPickers);
        //             setTimeout(function () {
        //                 $(`[tid="${ownId}"] .guided-tour-picker`).css("background-color", bgColorPickers);
        //             }, 400);
        //         }, 400);

        //     }

        //     // if user clicked on a PICK div in a container tab
        //     $(".guided-tour-picker-container").click(function (me) {

        //         const myParentAttr =
        //             me.currentTarget.parentElement.attributes["data-itemid"];
        //         const selector = `[data-itemid="${myParentAttr.value}"]`;
        //         //     function play2(ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, lStorageKey, lStorageVal) {
        //         //console.log(guided_tour_global);
        //         /*
        //         console.log('like layout?', arg);
        //         var mimikGlobal = {
        //           tooltipsCache: JSON.parse(`{"${ownId}":[]}`),
        //           isSingleMode: false,
        //           licensedObjs: JSON.parse(`{"${ownId}":true}`),
        //           activeTooltip: JSON.parse(`{"${currSheet}":{"${ownId}":-2}}`)
        //         };
        //         mimikGlobal.tooltipsCache[ownId].push([{ qText: selector }, { qText: 'This is a new tooltip' }]);
        //         functions.play2(ownId, arg, 0, null, enigma, mimikGlobal, currSheet);
        //         */
        //         if (myParentAttr) {
        //             addToList(selector, "css");
        //         }
        //     });

        //     $(".guided-tour-picker").click(function (me) {



        //         var parent = me.currentTarget;
        //         // go up the parents tree until the level where the class contains 'cell'
        //         // ... maybe one point replace with jquery's .closest() function which does exactly that
        //         var i = 0;
        //         while (!parent.classList.contains("cell") && i < 6) {
        //             i++;
        //             parent = parent.parentElement;
        //         }

        //         if (
        //             parent.classList.contains("cell") &&
        //             parent.attributes.hasOwnProperty("tid")
        //         ) {
        //             // Object Id found 
        //             var objId = parent.attributes["tid"].value;
        //             addToList(objId, "tid");

        //         } else {
        //             console.error(
        //                 "Object Id not found while going " + i + " parent levels up",
        //                 parent
        //             );
        //         }
        //     });

        //     // the current extension object gets different button DONE
        //     $(`[tid="${ownId}"] .qv-inner-object`)
        //         .prepend(divPICK('guided-tour-picker', 'DONE'));

        //     // the current extension object gets different onclick event
        //     $(`[tid="${ownId}"] .guided-tour-picker`).click(function (me) {
        //         console.log("Those are the objectIds you picked:");
        //         console.log(pickList.join("\n"));
        //         functions.leonardoMsg(
        //             ownId,
        //             "Picked Objects",
        //             `<label class="lui-radiobutton">
        //                 <input class="lui-radiobutton__input" type="radio" name="${ownId}_cb" checked id="${ownId}_opt1">
        //                 <div class="lui-radiobutton__radio-wrap">
        //                 <span class="lui-radiobutton__radio"></span>
        //                 <span class="lui-radiobutton__radio-text">Object IDs and type/title</span>
        //                 </div>
        //             </label>
        //             <label class="lui-radiobutton">
        //                 <input class="lui-radiobutton__input" type="radio" name="${ownId}_cb" id="${ownId}_opt2">
        //                 <div class="lui-radiobutton__radio-wrap">
        //                 <span class="lui-radiobutton__radio"></span>
        //                 <span class="lui-radiobutton__radio-text">Just object IDs</span>
        //                 </div>
        //             </label>
        //             <textarea class="lui-textarea" style="height:140px;font-size:11pt;margin:10px 0;" id="${ownId}_textarea">${pickList.join(
        //                 "\n"
        //             )}</textarea>
        //             <button class="lui-button" onclick="document.getElementById('${ownId}_textarea').select();document.execCommand('copy');">Copy to clipboard</button>
        //             <button class="lui-button" id="${ownId}_test">Test Save as app attachment</button>`,
        //             "Close",
        //             null,
        //             false
        //         );
        //         $(`#msgparent_${ownId} .lui-dialog`).css('width', '500px');
        //         $(`#${ownId}_opt1`).click(function () {
        //             $(`#${ownId}_textarea`).html(pickList.join("\n"));
        //         });
        //         $(`#${ownId}_opt2`).click(function () {
        //             $(`#${ownId}_textarea`).html(pickList2.join("\n"));
        //         });
        //         $(`#msgok_${ownId}`).click(function () {
        //             $(`#msgparent_${ownId}`).remove();
        //             pickList = [];
        //             pickList2 = [];
        //         });
        //         // $(`#${ownId}_test`).click(async function () {
        //         //     const app = qlik.currApp(this);
        //         //     await doAjax('POST', "../../qrs/appcontent/" + app.id
        //         //         + "/uploadfile?externalpath=tour1.txt&overwrite=true", ownId, {}, JSON.stringify(
        //         //             { tour: "abc", tooltips: [], css: {} }
        //         //         ).replace(/{/g, '\n{').replace(/\[/g, '\n['));
        //         // });
        //         $(".guided-tour-picker").remove();
        //         $(".guided-tour-picker-container").remove();
        //     });
        // },

        pickOne: function (ownId, cssSelector) {

            $(".guided-tour-picker").remove(); // remove previous divs
            const posCorr = $(`[tid="${ownId}"]`).offset();

            $(".cell") // root DOM element for all grid cells of Qlik Sense client
                .not(`[tid="${ownId}"]`)
                //.find(".qv-inner-object")
                .each(function (i, e) {
                    const pickedObj = $(e).attr('tid');
                    if (pickedObj) {
                        // Add an absolute selector
                        $(`[tid="${ownId}"]`)
                            .prepend(divPICK(`guided-tour-picker guided-tour-picker-${i}`, 'PICK'));
                        //.prepend(`<div id="guided-tour-picker-${i}" class="guided-tour-picker">PICK</div>`)
                        $(`.guided-tour-picker-${i}`)
                            .css({
                                top: $(e).offset().top - posCorr.top,
                                left: $(e).offset().left - posCorr.left,
                            })
                            .click(function () {
                                const objType = $(`[tid="${pickedObj}"] article`).attr('tid').replace('qv-object-', '');
                                console.log('picked object', objType, pickedObj);
                                if ($(cssSelector).length == 1) {
                                    $(cssSelector).trigger('qv-activate');
                                    $(cssSelector).val(objType + ':' + pickedObj);
                                    $(cssSelector).trigger('change');
                                    const bgBefore = $(cssSelector).css('background-color');
                                    $(cssSelector).animate({
                                        backgroundColor: 'yellow'
                                    }, 400, function () {
                                        $(cssSelector).css('background-color', bgBefore);
                                    })
                                } else {
                                    alert('Looks like you navigated away from the Guided Tours Properties panel.');
                                }
                                $(".guided-tour-picker").remove();
                            })
                    }
                })
        }
    };
});

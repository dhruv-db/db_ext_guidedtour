
define(["qlik", "jquery", "text!./styles.css", "./js/props", "./js/tooltips",
    "./js/picker", "./js/qlik-css-selectors", "./licenseUtils/check_license"], function
    (qlik, $, cssContent, props, tooltips,
        picker, qlikCss, checkLicenseModule) {

    'use strict';

    // import('../db_ext_guided_tour_3/js/license.js')
    //     .then((lic) => {
    //         lic.hw();
    //     })
    //     .catch((err) => {
    //         console.error('Failed to load module:', err);
    //     });


    const hintTxt = 'This is a tour without any tooltips yet. <ul><li>Please click on the small <strong>'
        + '<span style="background:green;color:white;border-radius:10px;">&nbsp;+&nbsp;</span></strong>'
        + ' icons shown in the top left corner of an object to add it to the tour.</li><li>Then'
        + ' continue to edit them in the right property panel (accordeon) of this extension.</li></ul>';
    const noItemsTxt = "\u26A0\uFE0F Please add some objects.";

    var guided_tour_global = {
        qext: {}, // extension meta-information
        //hashmap: license.hashmap(location.hostname, 'db_ext_guided_tour'), // hash map for the license check
        licensesGlobal: {}, // all licenses from the extension setting, the licenses.json file
        // checkLicenseModule: null, // placeholder to put the module of extension db_ext_licenses (loaded with require)
        licensesGitoqlok: {}, // licenses from gitoqlok object
        licensedObjs: {}, // list of all extension-ids which have a license
        activeTooltip: {},  // remember all active tours, contains later one entry per extension and the 
        // an integer shows the active tooltip (0..n) or -2 if tour is inactive, -1 (in hover-mode) if armed
        visitedTours: {},  // all extension-ids which will be started, are added to this object
        tooltipsCache: {}, // the tour items of each tour will be put here under the key of the objectId when started 
        noLicenseWarning: {}, // in order not to suppress repeating license warnings , every extension id is added here once the warning was shown
        objAliases: {}
    }

    // load optional module license
    // if (!guided_tour_global.checkLicenseModule) {
    //     require(['../extensions/db_ext_licenses/check_licenses.js'],
    //         function (checkLicenseModule) {
    //             guided_tour_global.checkLicenseModule = checkLicenseModule; // put module into global object
    // Get JSON with licenses
    $.ajax({
        url: '../extensions/db_ext_licenses/licenses.json',
        dataType: 'json',
        async: true,  // don't wait for this call to finish.
        success: function (data) {
            guided_tour_global.licensesGlobal = data;
            // guided_tour_global.licenseSource = 'db_ext_licenses/licenses.json';
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('Did not find licenses.json in "db_ext_licenses" extension. Contact databridge.ch');
        }
    });
    //         },
    //         function (err) {
    //             console.warn('databridge licenses extension "db_ext_licenses" not found. Running in unlicensed mode.');
    //         }
    //     );
    // }

    // const lStorageDefault = '{"openedAt":"18991231000000", "objectsOpened": {}}';
    // function noLicenseMsg(mode) {
    //     return `The ${mode} mode would start now, if you had a license for the guided-tour extension.
    //             <br/><br/>Get in touch with <a href="mailto:insight-sales@databridge.ch">insight-sales@databridge.ch</a> '
    //             or choose a license-free mode of operation.`
    // };


    $("<style>").html(cssContent).appendTo("head");

    $.ajax({
        url: '../extensions/db_ext_guided_tour_3/db_ext_guided_tour_3.qext',
        dataType: 'json',
        async: false,  // wait for this call to finish.
        success: function (data) { guided_tour_global.qext = data; }
    });

    function getActiveTour(ownId, currSheet, layout) {
        // returns the tour id which is currently active, or false if no tour is active
        var activeTour = false;
        if ($('.guided-tour-toolip-parent').length == 0) {
            // no tour is open on this sheet. Set all tours of this sheet to -2
            for (const tourId in guided_tour_global.activeTooltip[currSheet]) {
                guided_tour_global.activeTooltip[currSheet][tourId] = -2
            }
        } else {
            for (const sheetId in guided_tour_global.activeTooltip) {
                for (const tourId in guided_tour_global.activeTooltip[sheetId]) {
                    if (guided_tour_global.activeTooltip[sheetId][tourId] > -2) {
                        if (tourId == ownId) {
                            // console.log(ownId, `This tour is already active.`);
                        } else {
                            if (layout.pConsoleLog) console.log(ownId, `other tour ${tourId} is already active.`);
                        }
                        activeTour = tourId;
                    }
                }
            }
        }
        return activeTour;
    }

    function closeOtherTourObj(ownId, currSheet) {
        for (const sheetId in guided_tour_global.activeTooltip) {
            for (const tourId in guided_tour_global.activeTooltip[sheetId]) {
                if (sheetId != currSheet) {
                    $(`#${tourId}_tooltip`).remove(); // close tooltips from other sheets found open
                    guided_tour_global.activeTooltip[sheetId][tourId] = -2;
                } else {

                }
            }
        }
    }

    return {
        initialProperties: {
            showTitles: false,
            disableNavMenu: true,
            // pLicenseJSON: { qStringExpression: { qExpr: "='$(vGuidedTourLicense)'" } },
            // qHyperCubeDef: {
            //     qDimensions: []
            // }
        },

        definition: {
            type: "items",
            component: "accordion",
            items: [
                // {
                //     uses: "dimensions",
                //     min: 0,
                //     max: 5
                // },
                // {
                //     uses: "sorting"  // no more needed. 
                // }, 
                {
                    uses: "settings"
                },
                props.tourItems(qlik, guided_tour_global),
                props.tourSettings(qlik.currApp(this), guided_tour_global),
                props.licensing(qlik.currApp(this), guided_tour_global),
                props.about(guided_tour_global)
            ]
        },
        snapshot: {
            canTakeSnapshot: false
        },

        resize: function ($element, layout) {

            const ownId = layout.qInfo.qId;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel
            const licensed = guided_tour_global.licensedObjs[ownId];

            const rootContainer = qlikCss.v(0).pageContainer;

            if (qlik.navigation.getMode() != 'edit') picker.pickersOff('*'); // close all pickers if any open
            if (layout.pConsoleLog) console.log(ownId, 'resize', layout, guided_tour_global);

            // if a tooltip is open, reposition it

            if ($(`#${ownId}_tooltip`).length > 0) {
                // get the target-selector from a html comment inside the tooltip
                const oldSelector = $(`#${ownId}_tooltip`).html().split('-->')[0].split('<!--')[1] || '';
                const oldOrient = $(`#${ownId}_tooltip`).attr("orient");
                const calcPositions = tooltips.findPositions2(oldSelector, rootContainer, `#${ownId}_tooltip`
                    , layout, $(`#${ownId}_tooltip`).css('background-color'), oldOrient);
                $(`#${ownId}_tooltip`)
                    .css('left', calcPositions.left).css('right', calcPositions.right)  // left or right
                    .css('top', calcPositions.top).css('bottom', calcPositions.bottom)  // top or bottom
                    .attr('orient', calcPositions.orient);
                $('.guided-tour-arrowhead').remove(); // the arrowhead may have changed toother edge; remove the old
                if (calcPositions.arrow) $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(calcPositions.arrow);  // arrowhead

            }

            return qlik.Promise.resolve();
        },

        paint: function ($element, layout) {

            var self = this;
            const ownId = layout.qInfo.qId;
            guided_tour_global.isSingleMode = document.location.href.split('?')[0].split('/').indexOf('single') > -1;
            const app = qlik.currApp(this);
            const enigma = app.model.enigmaModel;
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const mode = qlik.navigation.getMode();
            if (layout.pConsoleLog) console.log(ownId, 'paint', layout, guided_tour_global);
            if (mode != 'edit') picker.pickersOff(ownId);
            const lStorageKey = app.id + '|' + ownId;
            const objFieldName = null;
            // add sheet to activeTooltip object
            if (!Object(guided_tour_global.activeTooltip).hasOwnProperty(currSheet)) {
                guided_tour_global.activeTooltip[currSheet] = {};
            }
            // add this extension id to activeTooltip object
            if (!Object(guided_tour_global.activeTooltip[currSheet]).hasOwnProperty(ownId)) {
                guided_tour_global.activeTooltip[currSheet][ownId] = -2;  // initialize in the global guided_tour_global.activeTooltip array this tour. -2 is: not started
            }
            if (layout.pConsoleLog) console.log('active tooltip', guided_tour_global.activeTooltip[currSheet][ownId]);
            closeOtherTourObj(ownId, currSheet);
            // console.log(guided_tour_global.activeTooltip);

            // calculate some settings for the HTML, what divs to show, the switch position ...
            const switchPosition = ($('#' + ownId + '_hovermode').is(':checked') && $(`#guided-tour-helpicon-${ownId}`).length) ? 'checked' : '';
            const showSwitch = layout.pLaunchMode == 'hover' && layout.pTourItems.length > 0;
            const showPlayOrRotate = layout.pLaunchMode != 'hover' && layout.pTourItems.length > 0 && layout.pShowIcon;
            const showNoItemsHint = layout.pTourItems.length == 0;

            $element.html(`
                <div id="${ownId}_parent" class="guided-tour-parent" 
                    style="${layout.pObjectStyle}">
                    <!-- Leonardo Switch -->
                    <div class="lui-switch" 
                        style="${!showSwitch ? 'display:none;' : ''}">
                      <label class="lui-switch__label">
                        <input type="checkbox" class="lui-switch__checkbox" aria-label="Label" 
                            id="${ownId}_hovermode" ${switchPosition} />
                        <span class="lui-switch__wrap">
                          <span class="lui-switch__inner"></span>
                          <span class="lui-switch__switch"></span>
                        </span>
                      </label>
                    </div>
                    
                    <div style="text-align:center;${!showPlayOrRotate ? 'display:none;' : ''}">
                        <!-- Rotating icon -->
                        <span id="${ownId}_rotate" class="guided-tour-rotate  lui-icon  lui-icon--large  lui-icon--reload"
                          style="display:none;"></span> 
                        <!-- Play icon -->
                        <span id="${ownId}_play" class="guided-tour-play  guided-tour-launch-${ownId}  lui-icon  lui-icon--large  lui-icon--play"></span> 
                    </div>
                    <div class="guided-tour-no-items-hint" style="${!showNoItemsHint ? 'display:none;' : ''}">
                        ${noItemsTxt}
                    </div>  
                    <!--preload image: it's not rendered but browser loads is-->
                    <img style="display:none;" src="../extensions/db_ext_guided_tour_3/pics/how-to-add.gif"> 
                    <div class="guided-tour-label  guided-tour-launch-${ownId}" style="${showNoItemsHint ? 'display:none;' : `cursor: 'pointer'`}">
                        ${layout.pTextStart}
                    </div>
                </div>    
                </div>
            `);

            // if (showNoItemsHint) {
            //     $(`#${ownId}_parent .guided-tour-no-items-hint`).click(function () {
            //         if (qlik.navigation.getMode() == 'edit') picker.pickersOn(ownId, enigma, null, layout)
            //     })
            // }
            if (showNoItemsHint) {
                if (qlik.navigation.getMode() == 'edit') {
                    picker.pickersOn(ownId, enigma, null, layout, guided_tour_global, currSheet, tooltips);
                }
            }
            $(`.guided-tour-no-items-hint`).on('mouseover', function (o) {
                var gtCopy = JSON.parse(JSON.stringify(guided_tour_global));
                gtCopy.activeTooltip[currSheet][ownId] = -1;
                gtCopy.tooltipsCache[ownId] = [{
                    selector: `:${ownId}`,
                    html: `<center><img src="../extensions/db_ext_guided_tour_3/pics/how-to-add.gif" width="300" height="174"></center>
                        <br/>${hintTxt}`,
                    tooltipCustomStyles: `width:400px; height:400px; background:white; font-size:medium;`,
                    buttonCustomStyles: `opacity:0;`,
                    showCond: 1
                }];
                tooltips.play3(ownId, layout, 0, false, enigma, gtCopy, currSheet, true);
            });

            $(`.guided-tour-no-items-hint`).on('mouseout', function (o) {
                tooltips.endTour(ownId, guided_tour_global, currSheet, layout, -2);
            });

            $(`[tid="${ownId}"] ${qlikCss.v(0).innerObject}`).css('background-color', layout.pExtensionBgColor); // set bg-color in Sense Client

            // provide a license either from  db_ext_licenses extension (there's a .json) or from gitoqlok object
            if (!guided_tour_global.licensedObjs.hasOwnProperty(ownId)) {
                guided_tour_global.licensedObjs[ownId] = checkLicenseModule.vlt(
                    guided_tour_global.licensesGlobal, location.hostname, app.id).summary;

                // try to find an alternative license in gitoqlok meta-data object
                checkLicenseModule.gitoqlokObjects(app).then(gitoqlokObjArr => {
                    // console.log('resolved promises with gitoqlok objects', gitoqlokObjArr);
                    guided_tour_global.licensesGitoqlok = checkLicenseModule.getLatestGitoqlokLic(gitoqlokObjArr);
                    guided_tour_global.licensedObjs[ownId] = guided_tour_global.licensedObjs[ownId] || checkLicenseModule.vlt(
                        guided_tour_global.licensesGitoqlok, location.hostname, app.id).summary;
                })

                //console.log('recorded guided_tour_global.licensedObjs.' + ownId, guided_tour_global.licensedObjs);
            }

            const licensed = guided_tour_global.licensedObjs[ownId];
            guided_tour_global.tooltipsCache[ownId] = tooltips.getActiveTooltips(layout.pTourItems);


            //    ---------------------------------------------------
            if (layout.pLaunchMode == 'click') {
                //---------------------------------------------------
                // Standard-Mode ... plays entire tour on click, no auto-launch nor mouse-over
                $(`.guided-tour-helpicon-${ownId}`).remove(); // remove help icons, if still rendered.

                // $(`#${ownId}_play`).click(function () {1
                $(`.guided-tour-launch-${ownId}`).click(function () {
                    if (!getActiveTour(ownId, currSheet, layout)) {

                        // tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                        //     .then(function (hcube) {
                        guided_tour_global.tooltipsCache[ownId] = tooltips.getActiveTooltips(layout.pTourItems);
                        tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                        // })
                        // .catch(function () { });
                    } else {
                        // console.log('already playing', getActiveTour(ownId, currSheet, layout));
                        tooltips.endTour(ownId, guided_tour_global, currSheet, layout, -2);
                    }
                })
                //---------------------------------------------------
            } else if (layout.pLaunchMode == 'hover') {
                //---------------------------------------------------

                $(`#${ownId}_hovermode`).click(function () {
                    // if (!licensed) {
                    //     $(`#${ownId}_hovermode`).prop('checked', false);
                    //     tooltips.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg('Mouse-over'), null, 'OK');
                    // } else {
                    const hoverModeSwitch = $(`#${ownId}_hovermode`).is(':checked');
                    if (hoverModeSwitch == true) {
                        console.log(`switch tour ${ownId} to "on"`);
                        $('.guided-tour-picker').remove();  // hide pickers, if still open
                        $(`#${ownId}_tooltip`).remove(); // close open tooltips, if any

                        guided_tour_global.tooltipsCache[ownId].forEach((tooltipDef, tooltipNo) => {
                            //layout.pTourItems.forEach((tooltipDef, tooltipNo) => {
                            const divId = tooltipDef.selector.split(':').slice(-1)[0]; // use the text after : in the selector property;

                            var newDiv = $(`<div style="${layout.pHoverIconStyles}" 
                                    class="guided-tour-helpicon  guided-tour-helpicon-${ownId}">
                                    ${layout.pHoverIconText}</div>`);
                            newDiv
                                .on('click', () => {
                                    // if ($('#' + ownId + '_tooltip').length == 0) {
                                    tooltips.play3(ownId, layout, tooltipNo, false, enigma, guided_tour_global, currSheet, false);
                                    // }
                                })
                                .on('mouseover', () => {
                                    // if ($('#' + ownId + '_tooltip').length == 0) {
                                    tooltips.play3(ownId, layout, tooltipNo, false, enigma, guided_tour_global, currSheet, false);
                                    // }
                                })
                                .on('mouseout', () => {
                                    // console.log(tooltipNo, 'Closing');
                                    tooltips.endTour(ownId, guided_tour_global, currSheet, layout, -1);
                                    // $('#' + ownId + '_tooltip').remove();
                                    // guided_tour_global.activeTooltip[currSheet][ownId] = -1; // set activeTooltip to armed
                                    // // stop rotating the play icon
                                    // tooltips.playIcon(ownId);
                                });
                            $('[tid="' + divId + '"] .guided-tour-helpicon').remove(); // if previous help icon is there, remove it
                            $('[tid="' + divId + '"]').prepend(newDiv);

                            // $('[tid="' + divId + '"]')
                            //     .on('mouseover', () => {
                            //         if ($('#' + ownId + '_tooltip').length == 0) {  // tooltip is not yet open
                            //             tooltips.play3(ownId, layout, tooltipNo, false, enigma, guided_tour_global, currSheet, false);
                            //         }
                            //     })
                            //     .on('mouseout', () => {
                            //         // console.log(tooltipNo, 'Closing');
                            //         $('#' + ownId + '_tooltip').remove();
                            //     });
                        });
                        guided_tour_global.activeTooltip[currSheet][ownId] = -1; // set tour to "armed" 
                        //    })
                        //    .catch(function () { });

                    } else {
                        // switch to "off", unbind the events;
                        console.log(`switch tour ${ownId} to "off"`);
                        $('.guided-tour-helpicon').remove();
                        $(`#${ownId}_tooltip`).remove();
                        guided_tour_global.activeTooltip[currSheet][ownId] = -2;
                    }
                    // }
                })

                //---------------------------------------------------
            } /*else if (layout.pLaunchMode == 'auto-always') {
                     //---------------------------------------------------
                     // Auto-lauch always ... plays entire tour automatically once per session
                     if (mode == 'analysis' && !guided_tour_global.visitedTours[ownId] && !getActiveTour(ownId, currSheet, layout)) {
                         tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                             .then(function (hcube) {
                                 guided_tour_global.tooltipsCache[ownId] = hcube;
                                 tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                 guided_tour_global.visitedTours[ownId] = true;
                             })
                             .catch(function () { });
                     }
                     // on click, tour will be restarted.
                     $(`#${ownId}_play`).click(function () {
                         if (!getActiveTour(ownId, currSheet, layout)) {
                             tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                 .then(function (hcube) {
                                     guided_tour_global.tooltipsCache[ownId] = hcube;
                                     tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                     guided_tour_global.visitedTours[ownId] = true;
                                 })
                                 .catch(function () { });
                         }
                     })
                     //---------------------------------------------------
                 } else if (layout.pLaunchMode == 'auto-once') {
                     //---------------------------------------------------
                     // Auto-lauch once ... plays entire tour automatically and remember per user
                     // find out if it is the time to auto-start the tour
                     if (mode == 'analysis' && !getActiveTour(ownId, currSheet, layout)) {
                         enigma.evaluate("=TimeStamp(Now(),'YYYYMMDDhhmmss')").then(function (serverTime) {
                             var lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                             if (serverTime >= layout.pRelaunchAfter
                                 && layout.pRelaunchAfter > lStorageValue.openedAt) {
                                 if (licensed) {
                                     tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                         .then(function (hcube) {
                                             guided_tour_global.tooltipsCache[ownId] = hcube;
                                             tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                             lStorageValue.openedAt = serverTime + ''; // save as string
                                             window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageValue));
                                             if (layout.pConsoleLog) console.log(ownId, 'Stored locally: ', JSON.stringify(lStorageValue));
                                         });
     
                                 } else {
                                     if (layout.pConsoleLog) console.log(ownId, 'auto-once suppressed because no license');
                                     if (!guided_tour_global.noLicenseWarning[ownId]) {
                                         tooltips.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg('Auto-launch Once'), null, 'OK');
                                     }
                                     guided_tour_global.noLicenseWarning[ownId] = true;
                                 }
                                 //guided_tour_global.visitedTours[ownId] = true;
                             } else {
                                 if (layout.pConsoleLog) console.log(ownId, 'user already launched this tour.');
                             }
                         })
                     } else {
                         if (layout.pConsoleLog) console.log(ownId, 'auto-once suppressed because ' + (mode != 'analysis' ? (mode + '-mode') : 'other tour active'));
                     }
                     // on click, tour will be restarted.
                     $(`#${ownId}_play`).click(function () {
                         if (!getActiveTour(ownId, currSheet, layout)) {
                             tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                 .then(function (hcube) {
                                     guided_tour_global.tooltipsCache[ownId] = hcube;
                                     tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                     enigma.evaluate("=TimeStamp(Now(),'YYYYMMDDhhmmss')").then(function (serverTime) {
                                         const lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                                         lStorageValue.openedAt = serverTime + ''; // save as string
                                         window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageValue));
                                         if (layout.pConsoleLog) console.log(ownId, 'Stored locally: ', JSON.stringify(lStorageValue));
                                     })
                                     //guided_tour_global.visitedTours[ownId] = true;
                                 })
                                 .catch(function () { });
                         }
                     })
                     //---------------------------------------------------
                 } else if (layout.pLaunchMode == 'auto-once-p-obj') {
                     //---------------------------------------------------
                     // find out if auto-start of a tooltip is needed
                     if (mode == 'analysis' && !getActiveTour(ownId, currSheet, layout)) {
                         if (licensed) {
                             const lStorageValue = JSON.parse(window.localStorage.getItem(lStorageKey) || lStorageDefault);
                             // function (ownId, enigma, backendApi, objFieldName, tourFieldName, tourFieldVal, timestampFieldName, lStorageVal)
                             // console.log(ownId, 'starting in mode auto-once-p-obj', layout.pTimestampFromDim, lStorageValue)
                             tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal
                                 , layout.pTimestampFromDim, lStorageValue)
                                 .then(function (hcube) {
                                     guided_tour_global.tooltipsCache[ownId] = hcube;
                                     if (guided_tour_global.tooltipsCache[ownId].length > 0) {
                                         tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet, lStorageKey, lStorageValue);
                                     }
                                 })
                                 .catch(function () { });
                         } else {
                             if (layout.pConsoleLog) console.log(ownId, 'auto-once-p-obj suppressed because no license');
                             if (!guided_tour_global.noLicenseWarning[ownId]) {
                                 tooltips.leonardoMsg(ownId, 'Guided-Tour Extension', noLicenseMsg("Auto-launch Once Per Tooltip"), null, 'OK');
                             }
                             guided_tour_global.noLicenseWarning[ownId] = true;
                         }
     
                     } else {
                         if (layout.pConsoleLog) console.log(ownId, 'auto-once-p-obj suppressed because ' + (mode != 'analysis' ? (mode + '-mode') : 'other tour active'));
                     }
                     // on click, tour will be restarted.
                     $(`#${ownId}_play`).click(function () {
                         if (!getActiveTour(ownId, currSheet, layout)) {
                             tooltips.cacheHypercube(ownId, enigma, objFieldName, layout.pTourField, layout.pTourSelectVal)
                                 .then(function (hcube) {
                                     guided_tour_global.tooltipsCache[ownId] = hcube;
                                     tooltips.play3(ownId, layout, 0, false, enigma, guided_tour_global, currSheet);
                                 })
                                 .catch(function () { });
                         }
                     })
                 }
     */
            return qlik.Promise.resolve();

        }
    };
    //     },
    //     function (errLoadModule) {
    //         console.warn('databridge Licenser extension not found. Running in unlicensed mode ...', errLoadModule);
    //     }
    // );
});

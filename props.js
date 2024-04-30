// props.js: Extension properties (accordeon menu) externalized

define(["qlik", "jquery", "./functions", "./license", "./picker"], function
    (qlik, $, functions, license, picker) {

    const ext = 'db_ext_guided_tour_3';
    const cssSel1 = '.pp-section'; // class for accordeons top <div>
    const cssSel2 = '.pp-nm-di'; // class for sub-accordeons <li>
    const cssSel3 = '.pp-nm-di__header-content'; // class for <div> inside cssSel2 that should get the click event

    // var highlightedObj;

    function subSection(labelText, itemsArray, argKey, argVal) {
        var ret = {
            component: 'expandable-items',
            items: {}
        };
        var hash = 0;
        for (var j = 0; j < labelText.length; j++) {
            hash = ((hash << 5) - hash) + labelText.charCodeAt(j)
            hash |= 0;
        }
        ret.items[hash] = {
            label: labelText,
            type: 'items',
            show: function (arg) { return (argKey && argVal) ? (arg[argKey] == argVal) : true },
            items: itemsArray
        };
        return ret;
    }

    function getDimNames(props, indexOrLabel) {
        // returns the labels/field names of the Dimension in this qHyperCubeDef as an array of {value: #, label: ""}
        var opt = [{ value: "", label: "- not assigned -" }];
        var i = -1;
        for (const dim of props.qHyperCubeDef.qDimensions) {
            i++;
            var label = dim.qDef.qFieldLabels[0].length == 0 ? dim.qDef.qFieldDefs[0] : dim.qDef.qFieldLabels[0];
            if (label.substr(0, 1) == '=') label = label.substr(1);
            if (i >= 2) opt.push({  // skip the first 2 dimensions
                value: indexOrLabel == 'label' ? label : i,
                label: label
            });
        }
        return opt;
    }
    /*
        function checkSortOrder(arg) {
            const sortByLoadOrder = arg.qHyperCubeDef.qDimensions[0] ?
                (arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByExpression == 0
                    && arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByNumeric == 0
                    && arg.qHyperCubeDef.qDimensions[0].qDef.qSortCriterias[0].qSortByAscii == 0) : false;
            const interSort = arg.qHyperCubeDef.qInterColumnSortOrder.length > 0 ? (arg.qHyperCubeDef.qInterColumnSortOrder[0] == 0) : false;
            //console.log('qSortCriterias', arg.qHyperCubeDef.qInterColumnSortOrder[0], sortByLoadOrder, interSort);
            return !sortByLoadOrder || !interSort;
        }
    */
    async function resolveProperty(prop, enigma) {
        // takes care of a property being either a constant or a expression, which needs to be evaluated
        var ret;
        if (prop.qStringExpression) {
            ret = await enigma.evaluate(prop.qStringExpression.qExpr);
            //console.log('was expression: ', ret);
        } else {
            //console.log(prop,' was constant');
            ret = prop;
        }
        return ret;
    }

    function getTourItemsSectionPos() {
        var domPos = null;
        // now inspect the DOM model for CSS class 'pp-section' elements
        $(cssSel1).each(function (i, e) {
            // console.log('DOM:', i, '.pp-section', $(e)[0].innerText);
            domPos = $(e)[0].innerText.indexOf('Tooltip Items') >= 0 ? i : domPos
        })
        return domPos
    }

    function getItemPos(arg, context) {
        // with two arguments arg and context, the function an search by a unique, automatically set cId
        // attribute within the array of the property tree, which is the nth position
        const this_cId = arg.cId;  // unique id of the given item within pTourItems array
        //console.log('looking for', this_cId);
        var itemPos = null;
        context.properties.pTourItems.forEach(function (tourItem, i) {
            itemPos = tourItem.cId == this_cId ? i : itemPos
        });
        return itemPos
    }

    return {

        tourItems: function (qlik, guided_tour_global) {
            const app = qlik.currApp();
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const enigma = app.model.enigmaModel;

            return {
                label: function (arg) {
                    // console.log('rendering tourItems label', arg);
                    const domPos = getTourItemsSectionPos();
                    //$(`.pp-accordion-container [tid="1"] .pp-nm-di__header-content`)
                    if (domPos) {
                        $(`${cssSel1}:nth-child(${domPos + 1}) ${cssSel3}`)
                            .not('[guided-tour-event="click"]')
                            //.css('border', 'gray 1px solid')
                            .attr('guided-tour-event', 'click')
                            .click(function (e) {
                                console.log('guided-tour-click-item', $(e.currentTarget)[0].innerText);
                                const selector = $(e.currentTarget)[0].innerText.split(':').splice(-1)[0];
                                const closestInput = $(e.currentTarget);//.closest('li').find('[tid="selector"] .label');
                                if (selector) {
                                    const elem = $(`[tid="${selector}"]`);
                                    if (elem.length) {
                                        const bgBefore = elem.css('background-color');
                                        elem.animate({
                                            backgroundColor: 'yellow'
                                        }, 300, function () {
                                            elem.css('background-color', bgBefore);
                                        });
                                        closestInput.css('border', '1px solid green');
                                    } else {
                                        // bad selector
                                        closestInput.css('border', '2px solid red');
                                    }
                                }
                            });
                    }
                    return `💬 Tooltip Items (${arg.pTourItems ? arg.pTourItems.length : 0})`
                },
                type: 'items',
                items: [
                    {
                        type: "array",
                        ref: "pTourItems",
                        itemTitleRef: "selector",
                        allowAdd: true,
                        allowRemove: true,
                        addTranslation: "Add Tooltip",
                        items: {
                            /*label: {
                                ref: "label",
                                type: "string",
                                label: "Label"
                            },*/
                            selector: {
                                ref: "selector",
                                label: function (arg, context) {
                                    var itemPos = getItemPos(arg, context);
                                    // we "abuse" this function to hightlight for 1/3 second the
                                    // object it refers to. 
                                    // if (arg.selector) {
                                    //     // put current properties into tooltipsCache
                                    //     guided_tour_global.tooltipsCache[context.properties.qInfo.qId] = JSON.parse(JSON.stringify(context.properties.pTourItems));
                                    //     functions.play3(context.properties.qInfo.qId, context.layout, itemPos, false, enigma,
                                    //         guided_tour_global, currSheet);
                                    // }

                                    //const newHighlightedObj = arg.selector.split(':').slice(-1)[0];
                                    // var highlightedObj = arg.selector.split(':').slice(-1)[0];
                                    // if (arg.selector) {  // && highlightedObj != newHighlightedObj) {
                                    //     //highlightedObj = newHighlightedObj
                                    //     //console.log('rendering tour item', highlightedObj);
                                    //     const elem = $(`[tid="${highlightedObj}"]`);
                                    //     const bgBefore = 'rgba(0,0,0,0)'; // elem.css('background-color');
                                    //     elem.animate({
                                    //         backgroundColor: 'yellow'
                                    //     }, 300, function () {
                                    //         elem.css('background-color', bgBefore);
                                    //     })
                                    // }

                                    return "CSS selector"
                                },
                                type: "string"
                            },
                            picker: {
                                label: function (arg) {
                                    return arg.selector ? "Preview tooltip" : "Pick object"
                                },
                                component: "button",
                                action: function (arg, context) {
                                    const inputRef = 'selector';  // property name 

                                    var itemPos = getItemPos(arg, context);

                                    // find out if the button was previously pressed and the user is still in "pick-mode"
                                    if (arg.selector) {
                                        // put current properties into tooltipsCache
                                        guided_tour_global.tooltipsCache[context.properties.qInfo.qId] = JSON.parse(JSON.stringify(context.properties.pTourItems));
                                        functions.play3(
                                            context.properties.qInfo.qId, context.layout, itemPos, false, enigma,
                                            guided_tour_global, currSheet);
                                    }
                                    else if ($('.guided-tour-picker').length > 0) {
                                        // end the pick-mode
                                        $('.guided-tour-picker').remove();
                                    } else {

                                        // console.log('found in pos', itemPos);
                                        const domPos = getTourItemsSectionPos();
                                        if (domPos) {
                                            //console.log('found in DOM', domPos);
                                            const cssSelector = `${cssSel1}:nth-child(${domPos + 1}) ${cssSel2}:nth-child(${itemPos + 1}) [tid="${inputRef}"] input`;
                                            // console.log('cssSelector', cssSelector);
                                            if ($(cssSelector).length > 0) {
                                                picker.pickOne(context.properties.qInfo.qId, enigma, itemPos);

                                            } else {
                                                alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', cssSelector);
                                            }
                                        } else {
                                            alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', cssSel1);
                                        }
                                    }
                                }
                            },
                            html: {
                                ref: "html",
                                label: "Text (HTML)",
                                type: "string",
                                component: "textarea",
                                rows: 5,
                                maxlength: 4000,
                                expression: 'optional'
                            },
                            more: {
                                component: 'expandable-items',
                                items: {
                                    rnd1: {
                                        label: "More Settings",
                                        type: "items",
                                        items: {
                                            cssTooltipBase: { // For custom css tooltip style
                                                ref: "pCustomStyles",
                                                label: "CSS (Tooltip Base)",
                                                type: "string",
                                                component: "textarea",
                                                rows: 4,
                                                maxlength: 4000,
                                                expression: 'optional',
                                                defaultValue: 'background-color: rgb(250 15 15 / 90%);'
                                            },
                                        }
                                    }
                                }
                            }

                        }
                    }
                ]
            }

        },

        tourSettings: function (app, guided_tour_global) {
            const enigma = app.model.enigmaModel;
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            return {
                label: "⚙️ Tour Settings",
                type: 'items',
                items: [
                    /*{
                        label: "The first two dimensions are mandatory: object-id and text",
                        component: "text"
                    },*/
                    {
                        label: 'Mode to launch tour',
                        type: 'string',
                        component: 'dropdown',
                        ref: 'pLaunchMode',
                        defaultValue: 'click',
                        options: [
                            {
                                value: "click",
                                label: "Click to run tour"
                            },
                            // {
                            //     value: "hover",
                            //     label: "Move mouse over objects \u2605"
                            // },
                            // {
                            //     value: "auto-always",
                            //     label: "Auto-launch tour (always)"
                            // },
                            // {
                            //     value: "auto-once",
                            //     label: "Auto-launch tour once \u2605"
                            // },
                            // {
                            //     value: "auto-once-p-obj",
                            //     label: "Auto-launch tooltips once \u2605"
                            // }
                        ]
                    },
                    {
                        label: "Note: Mouse-over mode only supports Sense object IDs, no other CSS-selectors.",
                        component: "text",
                        show: function (arg) { return arg.pLaunchMode == 'hover' }
                    },
                    {
                        label: "\u26a0 You have to specify a timestamp field in the auto-launch settings",
                        component: "text",
                        show: function (arg) { return arg.pLaunchMode == 'auto-once-p-obj' && arg.pTimestampFromDim.length == 0 }
                    },
                    {
                        label: "\u2605 Premium feature only with license",
                        component: "text"
                    },
                    /*{
                        label: "Select objects for tour",
                        component: "button",
                        action: function (arg) {
                            console.log('arg', arg);
                            picker.pick(arg.qInfo.qId, enigma, guided_tour_global);
                        }
                    }
                    */
                    /*, subSection('Select A Specific Tour', [
                        {
                            label: "If you have multiple tours in your data model, you may want to filter the right one by making below selection",
                            component: "text"
                        }, 
{
                            label: 'Select in field',
                            type: 'string',
                            ref: 'pTourField',
                            expression: 'optional'
                        }, 
{
                            label: 'Select this value',
                            type: 'string',
                            ref: 'pTourSelectVal',
                            expression: 'optional'
                        }
                    ]) 
                    */
                    , subSection('Button Text & Color', [
                        {
                            label: 'Text for Tour Start',
                            type: 'string',
                            ref: 'pTextStart',
                            defaultValue: 'Start Tour',
                            expression: 'optional'
                        }, /*{
                        label: "Mouse-Over Mode \u2605",
                        type: "boolean",
                        component: "switch",
                        ref: "pHoverMode",
                        defaultValue: false,
                        trueOption: {
                            value: true,
                            translation: "On - Hover tooltips"
                        },
                        falseOption: {
                            value: false,
                            translation: "Off - Sequential Tour"
                        }
                    },*/ {
                            type: "boolean",
                            defaultValue: true,
                            ref: "pShowIcon",
                            label: "Show play icon",
                            show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        {
                            label: 'Font-color of button',
                            type: 'string',
                            ref: 'pExtensionFontColor',
                            expression: 'optional',
                            defaultValue: '#333333'
                        },
                        {
                            label: 'Background-color of button',
                            type: 'string',
                            ref: 'pExtensionBgColor',
                            expression: 'optional',
                            defaultValue: 'white'
                        },
                        {
                            label: 'More styling',
                            type: 'string',
                            ref: 'pMoreStyles',
                            defaultValue: 'font-size:large;',
                            expression: 'optional'
                        }
                    ])
                    , subSection('Tooltips Texts & Colors', [
                        {
                            label: 'Text for Next button',
                            type: 'string',
                            ref: 'pTextNext',
                            defaultValue: 'Next',
                            expression: 'optional'
                        },
                        {
                            label: 'Text for Done button',
                            type: 'string',
                            ref: 'pTextDone',
                            defaultValue: 'Done',
                            expression: 'optional'
                        },
                        {
                            label: 'Default tooltip font color',
                            type: 'string',
                            ref: 'pFontColor',
                            defaultValue: '#e0e0e0',
                            expression: 'optional'
                        },
                        {
                            label: 'Default tooltip backgr-color',
                            type: 'string',
                            ref: 'pBgColor',
                            defaultValue: 'rgba(0,0,0,0.9)',
                            expression: 'optional'
                        },
                        {
                            label: 'Default tooltip width (px)',
                            type: 'number',
                            ref: 'pDefaultWidth',
                            defaultValue: 250,
                            expression: 'optional'
                        }, /*{
                        label: 'More attributes in dimension',
                        component: "dropdown",
                        ref: "pAttrFromDim",
                        defaultValue: "",
                        options: function (arg) { return getDimNames(arg); }
                    },*/ {
                            type: "number",
                            component: "slider",
                            label: function (arg) { return 'ArrowHead Size ' + arg.pArrowHead + 'px' },
                            ref: "pArrowHead",
                            min: 8,
                            max: 20,
                            step: 4,
                            defaultValue: 16
                        }
                    ])
                    , subSection('Auto-launch Settings (Tour)\u2605', [
                        {
                            label: "These settings apply only if you have a licensed version.",
                            component: "text"
                        }, {
                            label: 'Relaunch once after',
                            type: 'string',
                            ref: 'pRelaunchAfter',
                            defaultValue: '18991231235959',
                            expression: 'optional'
                        },
                        {
                            label: "Format: YYYYMMDDhhmmss",
                            component: "text"
                        },
                        {
                            label: function (arg) { return 'Saved settings: ' + window.localStorage.getItem(app.id + '|' + arg.qInfo.qId) },
                            component: "text"
                        },
                        {
                            label: "Clear saved settings",
                            component: "button",
                            action: function (arg) {
                                window.localStorage.removeItem(app.id + '|' + arg.qInfo.qId);
                                functions.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
                            }
                        }
                    ], 'pLaunchMode', 'auto-once'  // only show settings section if pLaunchMode == 'auto-once'
                    )
                    , subSection('Auto-launch Settings (Obj)\u2605', [
                        {
                            label: "These settings apply only if you have a licensed version.",
                            component: "text"
                        },
                        {
                            label: 'Timestamp field for every object',
                            component: "dropdown",
                            ref: "pTimestampFromDim",
                            defaultValue: "",
                            options: function (arg) { return getDimNames(arg, 'label'); }
                        },
                        {
                            label: "Format: YYYYMMDDhhmmss",
                            component: "text"
                        },
                        {
                            label: function (arg) { return 'Saved settings: ' + window.localStorage.getItem(app.id + '|' + arg.qInfo.qId) },
                            component: "text"
                        },
                        {
                            label: "Clear saved settings",
                            component: "button",
                            action: function (arg) {
                                window.localStorage.removeItem(app.id + '|' + arg.qInfo.qId);
                                functions.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
                            }
                        }
                    ], 'pLaunchMode', 'auto-once-p-obj'  // only show settings section if pLaunchMode == 'auto-once-p-obj'
                    )
                    , subSection('Advanced Settings', [
                        {
                            label: function (arg) { return 'Opacity of inactive objects: ' + arg.pOpacity },
                            type: 'number',
                            ref: 'pOpacity',
                            component: "slider",
                            defaultValue: 0.1,
                            min: 0.1,
                            max: 1,
                            step: 0.1,
                            show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        {
                            type: "boolean",
                            defaultValue: false,
                            ref: "pConsoleLog",
                            label: "console.log debugging info"
                        }
                    ])
                ]
            }
        },

        licensing: function (app) {
            const enigma = app.model.enigmaModel;
            return {
                label: 'License',
                type: 'items',
                items: [
                    {
                        type: "string",
                        ref: "pLicenseJSON",
                        label: "License String",
                        component: "textarea",
                        rows: 5,
                        maxlength: 4000,
                        expression: 'optional'
                    },
                    {
                        label: "Contact data/\\bridge",
                        component: "link",
                        url: 'https://www.databridge.ch/contact-us'
                    },
                    {
                        label: 'Test response for this hostname',
                        type: 'string',
                        ref: 'pTestHostname'
                    },
                    {
                        label: "Check License",
                        component: "button",
                        action: function (arg) {

                            const ownId = arg.qInfo.qId;
                            resolveProperty(arg.pLicenseJSON, enigma).then(function (lstr) {
                                const hostname = arg.pTestHostname ? (arg.pTestHostname.length > 0 ? arg.pTestHostname : location.hostname) : location.hostname;
                                const report = license.chkLicenseJson(lstr, 'db_ext_guided_tour', hostname, true);
                                functions.leonardoMsg(ownId, 'Result', report, null, 'OK');
                                $('#msgparent_' + ownId + ' th').css('text-align', 'left');
                                // make window wider
                                if (report.length > 200) $('#msgparent_' + ownId + ' .lui-dialog').css('width', '700px');
                            });
                        }
                    }
                ]
            }
        },

        about: function (qext) {
            return {
                label: 'About this extension',
                type: 'items',
                items: [
                    {
                        label: function (arg) { return 'Installed version: ' + qext.version },
                        component: "link",
                        url: '../extensions/db_ext_guided_tour_3/db_ext_guided_tour_3.qext'
                    },
                    {
                        label: "This extension is available either licensed or free of charge by data/\\bridge, Qlik OEM partner and specialist for Mashup integrations.",
                        component: "text"
                    },
                    {
                        label: "Without license you may use it as is. Licensed customers get support.",
                        component: "text"
                    },
                    {
                        label: "",
                        component: "text"
                    },
                    {
                        label: "About Us",
                        component: "link",
                        url: 'https://www.databridge.ch'
                    },
                    {
                        label: "More",
                        component: "button",
                        action: function (arg) {
                            console.log(arg);
                            window.open('https://insight.databridge.ch/items/guided-tour-extension', '_blank');
                        }
                    }
                ]
            }
        }
    }
});

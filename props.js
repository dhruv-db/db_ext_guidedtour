// props.js: Extension properties (accordeon menu) externalized

define(["qlik", "jquery", "./tooltips", "./license", "./picker", "./qlik-css-selectors"], function
    (qlik, $, tooltips, license, picker, qlikCss) {

    //const ext = 'db_ext_guided_tour_3';
    const ppSection = qlikCss.v(0).ppSection; // class for accordeons top <div>
    const ppNmDi = qlikCss.v(0).ppNmDi; // class for sub-accordeons <li>
    const ppNmDi_Content = qlikCss.v(0).ppNmDi_Content; // class for <div> inside ppNmDi that should get the click event
    const accordionHeaderCollapsed = qlikCss.v(0).accordionHeaderCollapsed;

    return {

        tourItems: function (qlik, guided_tour_global) {
            const app = qlik.currApp();
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const enigma = app.model.enigmaModel;

            return {
                label: function (arg, context) {
                    registerEvents(arg, context, enigma, guided_tour_global);
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
                        allowMove: true,
                        items: {
                            selector: {
                                ref: "selector",
                                label: function (arg, context) {
                                    var ret = "CSS selector";
                                    if (!selectorFound(arg.selector)) {
                                        ret = "\u{1F534} " + ret + " (not found)"
                                    } else if (arg.selector.length) {
                                        ret = "\u{1F7E2}" + ret
                                    }
                                    return ret
                                },
                                type: "string"
                            },
                            picker: {
                                label: "Pick object",
                                component: "button",
                                show: function (arg) { return !arg.selector },
                                action: function (arg, context) {
                                    pickerButtonClick(arg, context, enigma, guided_tour_global);
                                }
                            },
                            preview: {
                                label: "Preview tooltip",
                                component: "button",
                                show: function (arg) { return arg.selector.length > 0 },
                                action: function (arg, context) {
                                    previewButtonClick(arg, context, enigma, guided_tour_global, currSheet);
                                }
                            },
                            html: {
                                ref: "html",
                                label: "Text (HTML allowed)",
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
                                            MyText: {
                                                label: "❔ Example: background-color: rgb(250 15 15 / 90%);",
                                                component: "text"
                                            },
                                            cssTooltipBase: { // For custom css tooltip style
                                                ref: "pCustomStyles",
                                                label: "CSS (Tooltip Base)",
                                                type: "string",
                                                component: "textarea",
                                                rows: 4,
                                                maxlength: 4000,
                                                expression: 'optional',
                                            },
                                            orientation: {
                                                ref: "orientation",
                                                label: "Tooltip position",
                                                type: 'string',
                                                component: 'dropdown',
                                                defaultValue: "",
                                                options: [
                                                    {
                                                        value: "",
                                                        label: "automatic"
                                                    }, {
                                                        value: "h",
                                                        label: "left or right"
                                                    }, {
                                                        value: "v",
                                                        label: "above or below"
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }

                        }
                    }
                ]
            }

        },

        tourSettings: function (app, qlik) {
            //const enigma = app.model.enigmaModel;
            // const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
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
                        ref: 'pLaunchMode',
                        defaultValue: 'click',
                        component: 'dropdown',
                        options: [
                            {
                                value: "click",
                                label: "Click to run tour"
                            },
                            {
                                value: "hover",
                                label: "Icons for every object \u2605"
                            },
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
                    // {
                    //     label: "Note: Mouse-over mode only supports Sense object IDs, no other CSS-selectors.",
                    //     component: "text",
                    //     show: function (arg) { return arg.pLaunchMode == 'hover' }
                    // },
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
                        },
                        /*{
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

                    , subSection('Tooltips Appearance', [
                        {
                            label: 'Hover Icon Text',
                            type: 'string',
                            ref: 'pHoverIconText',
                            defaultValue: '?',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode == 'hover' }
                        },
                        {
                            label: "❔ Example: color: white;background-color: green",
                            component: "text",
                            show: function (arg) { return arg.pLaunchMode == 'hover' }
                        },
                        {
                            label: 'Hover Icon Custom CSS',
                            type: 'string',
                            ref: 'pHoverIconCustomCSS',
                            type: "string",
                            component: "textarea",
                            rows: 4,
                            maxlength: 4000,
                            defaultValue: 'color: #000000;background-color: #d3d3d3;top:-7px;',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode == 'hover' }
                        },



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
                            defaultValue: '#000000',
                            expression: 'optional'
                        },
                        {
                            label: 'Default tooltip backgr-color',
                            type: 'string',
                            ref: 'pBgColor',
                            defaultValue: '#fbfbfb',
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
                        },
                        {
                            type: "number",
                            component: "slider",
                            label: function (arg) { return 'Tooltip Border ' + arg.pTooltipBorder + 'px' },
                            ref: 'pTooltipBorder',
                            min: 0,
                            max: 5,
                            step: 1,
                            defaultValue: 2
                        },
                        {
                            label: 'Default tooltip border color',
                            type: 'string',
                            ref: 'pTooltipBorderColor',
                            defaultValue: 'rgba(0, 0, 0, 0.15)',
                            expression: 'optional'
                        },
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
                                tooltips.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
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
                                tooltips.leonardoMsg(arg.qInfo.qId, 'Success', 'Removed local item', null, 'OK');
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
                label: '🔑 License',
                type: 'items',
                items: [
                    {
                        type: "string",
                        ref: "pLicenseJSON",
                        label: "License String",
                        component: "textarea",
                        rows: 5,
                        maxlength: 4000,
                        expression: 'optional',
                        defaultValue: { qStringExpression: { qExpr: "=vGuidedTourLicense" } }
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
                                tooltips.leonardoMsg(ownId, 'Result', report, null, 'OK');
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
                label: 'ℹ️ About this extension',
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

    function selectorFound(objId) {
        // returns if the objId is found in the DOM model of the page
        const selector = objId.split(':').splice(-1)[0];
        return ($(`[tid="${selector}"]`).length > 0)
    }

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
        $(ppSection).each(function (i, e) {
            // console.log('DOM:', i, '.pp-section', $(e)[0].innerText);
            domPos = $(e)[0].innerText.indexOf('Tooltip Items') >= 0 ? i : domPos
        })
        $(`${ppSection} h4`)
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

    function registerEvents(arg, context, enigma) {
        // function to register click event in the accordeon when the Tooltip Items section
        // is clicked

        // console.log('function registerEvents', arg);

        const ownId = context.properties.qInfo.qId;
        const domPos = getTourItemsSectionPos();

        picker.pickersRefresh(ownId, context.properties.pTourItems);

        if (domPos) {

            if (!$(`${ppSection}:nth-child(${domPos + 1}) h4`).hasClass(accordionHeaderCollapsed)) {
                // the accordeon menu of "Tooltip Items" is open
                if ($(`${ppSection}:nth-child(${domPos + 1}) h4`).attr('guided-tour-event') != 'click') {
                    // the "click" event has not been registered
                    // $(`${ppSection}:nth-child(${domPos + 1}) h4`).css('background', 'floralwhite');
                    console.log('show pickers', Math.random());
                    picker.pickersOn(ownId, enigma, null, context.properties.pTourItems);
                }
            }
            // register click event on all main sections of accordeon menu
            $(`${ppSection} h4`)
                .not('[guided-tour-event="click"]')
                .attr('guided-tour-event', 'click') // add this attribute and the click event
                .click(function (e) {
                    // is the Tooltip Items section clicked?
                    const tid = getTourItemsSectionPos();
                    if ($(e.currentTarget).parent().attr('tid') == tid) {
                        //&& !$(e.currentTarget).hasClass(accordionHeaderCollapsed)) {
                        // clicked and open
                        // $(`${ppSection}:nth-child(${tid + 1}) h4`).css('background', 'floralwhite');
                        console.log('show pickers', Math.random());
                        picker.pickersOn(ownId, enigma, null, context.properties.pTourItems);

                    } else {
                        // clicked and closed
                        // $(`${ppSection}:nth-child(${tid + 1}) h4`).css('background', '');
                        console.log('hide pickers', Math.random());
                        picker.pickersOff(ownId);
                    }
                });

            // check all items if the selector is valid and mark the item with red background if not
            arg.pTourItems.forEach((tourItem, i) => {
                const selector = tourItem.selector.split(':').splice(-1)[0];
                const accordeonElem = $(`${ppSection}:nth-child(${domPos + 1}) li:nth-child(${i + 1}) ${ppNmDi_Content}`);
                if ($(`[tid="${selector}"]`).length == 0) {
                    // The given selector of that tour item is invalid
                    accordeonElem.css("background", "#b98888").css("color", "white");
                } else {
                    accordeonElem.css("background", "").css("color", "");
                }
            })

            $(`${ppSection}:nth-child(${domPos + 1}) ${ppNmDi_Content}`)
                .not('[guided-tour-event="click"]')
                //.css('border', 'gray 1px solid')
                .attr('guided-tour-event', 'click') // add this attribute and the click event0
                .click(function (e) {
                    console.log('guided-tour-click-item', $(e.currentTarget)[0].innerText);
                    const selector = $(e.currentTarget)[0].innerText.split(':').splice(-1)[0];
                    // const closestInput = $(e.currentTarget);//.closest('li').find('[tid="selector"] .label');
                    if (selector) {
                        const elem = $(`[tid="${selector}"]`);
                        if (elem.length) {
                            const bgBefore = elem.css('background-color');
                            elem.animate({
                                backgroundColor: 'yellow'
                            }, 300, function () {
                                elem.css('background-color', bgBefore);
                            });
                            // closestInput.css('border', '1px solid green');
                        } else {
                            // bad selector
                            // closestInput.css('border', '2px solid red');
                        }
                    }
                });
        } else {
            // console.error('function registerEvents: Could not find out which position in accordeon menu is the "Tooltip Items" section')
        }
    }

    function pickerButtonClick(arg, context, enigma, guided_tour_global) {

        // in the properties of Tooltip icons the Pick Object button was clicked.
        const inputRef = 'selector';  // property name 

        var itemPos = getItemPos(arg, context);

        // find out if the button was previously pressed and the user is still in "pick-mode"
        // if ($('.guided-tour-picker').length > 0) {
        //     // end the pick-mode
        //     picker.pickersOff(context.properties.qInfo.qId);

        // } else {

        // console.log('found in pos', itemPos);
        const domPos = getTourItemsSectionPos();
        if (domPos) {
            //console.log('found in DOM', domPos);
            const cssSelector = `${ppSection}:nth-child(${domPos + 1}) ${ppNmDi}:nth-child(${itemPos + 1}) [tid="${inputRef}"] input`;
            // console.log('cssSelector', cssSelector);
            if ($(cssSelector).length > 0) {
                picker.pickersOn(context.properties.qInfo.qId, enigma, itemPos, context.properties.pTourItems);

            } else {
                alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', cssSelector);
            }
        } else {
            alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', ppSection);
        }
        // }
    }

    function previewButtonClick(arg, context, enigma, guided_tour_global, currSheet) {

        // in the properties of Tooltip icons the Preview Tooltip button was clicked.
        const itemPos = getItemPos(arg, context);

        var isPreviewMode = true;
        // put current properties into tooltipsCache
        guided_tour_global.tooltipsCache[context.properties.qInfo.qId] = JSON.parse(JSON.stringify(context.properties.pTourItems));

        tooltips.play3(
            context.properties.qInfo.qId, context.layout, itemPos, false, enigma,
            guided_tour_global, currSheet, isPreviewMode
        );

    }
});

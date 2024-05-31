// props.js: Extension properties (accordeon menu) externalized

define(["qlik", "jquery", "./tooltips", "./license", "./picker", "./findObjects", "./qlik-css-selectors"], function
    (qlik, $, tooltips, license, picker, findObjects, qlikCss) {

    //const ext = 'db_ext_guided_tour_3';
    const ppSection = qlikCss.v(0).ppSection; // class for accordeons top <div>
    const ppNmDi = qlikCss.v(0).ppNmDi; // class for sub-accordeons <li>
    const ppNmDi_header = qlikCss.v(0).ppNmDi_header;
    const ppNmDi_content = qlikCss.v(0).ppNmDi_content; // class for <div> inside ppNmDi that should get the click event
    const accordionHeaderCollapsed = qlikCss.v(0).accordionHeaderCollapsed;

    return {

        tourItems: function (qlik, guided_tour_global) {
            const app = qlik.currApp();
            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
            const enigma = app.model.enigmaModel;

            return {
                label: function (arg, context) {
                    registerEvents(arg, context, enigma, guided_tour_global, currSheet);
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
                                show: function (arg) { return !arg.selector || !selectorFound(arg.selector) },
                                action: function (arg, context) {
                                    if (context.layout.pConsoleLog) console.log('pickerButtonClick', arg);
                                    pickerButtonClick(arg, context, enigma, guided_tour_global, currSheet);
                                }
                            },
                            preview: {
                                label: "Preview tooltip",
                                component: "button",
                                show: function (arg) { return arg.selector.length > 0 },
                                action: function (arg, context) {
                                    previewButtonClick(getItemPos(arg, context), context, enigma, guided_tour_global, currSheet);
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
                            showCond: {
                                ref: "showCond",
                                label: "Show Condition",
                                type: "string",
                                expression: 'optional',
                                defaultValue: { qStringExpression: { qExpr: "=1" } }
                            },
                            more: {
                                component: 'expandable-items',
                                items: {
                                    rnd1: {
                                        label: "More Settings",
                                        type: "items",
                                        items: {

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
                                            },
                                            // MyText: {
                                            //     label: "❔ Example: background-color: rgb(250 15 15 / 90%);",
                                            //     component: "text"
                                            // },
                                            tooltipCustomStyles: { // For custom css tooltip style
                                                ref: "tooltipCustomStyles",
                                                label: "Tooltip Style overrule",
                                                type: "string",
                                                component: "textarea",
                                                rows: 4,
                                                maxlength: 4000,
                                                expression: 'optional',
                                                defaultValue: "/*background: #333;\ncolor: white;\nborder-color:black;*/"
                                            },
                                            buttonCustomStyles: { // For custom css tooltip style
                                                ref: "buttonCustomStyles",
                                                label: "Tooltip Button Style overrule",
                                                type: "string",
                                                component: "textarea",
                                                rows: 4,
                                                maxlength: 4000,
                                                expression: 'optional',
                                                defaultValue: "/*background: #333;\ncolor: white;\nborder-color:white;*/"
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
                    {
                        label: 'Mode to launch tour',
                        type: 'string',
                        ref: 'pLaunchMode',
                        defaultValue: 'click',
                        component: 'dropdown',
                        options: [
                            {
                                value: "click",
                                label: "Sequential Items Tour"
                            },
                            {
                                value: "hover",
                                label: "Icons For Every Object " // \u2605
                            }
                        ]
                    },
                    subSection('Launcher Appearance', [
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
                            label: 'Styles for Play',
                            type: 'string',
                            ref: 'pObjectStyle',
                            type: "string",
                            component: "textarea",
                            rows: 4,
                            maxlength: 4000,
                            defaultValue: 'color: #333;\nbackground: white;\nfont-size: medium;',
                            expression: 'optional'
                        }
                        /*{
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
                        }*/
                    ])

                    , subSection('Tooltips Appearance', [

                        {
                            label: 'Tooltip Default Style',
                            type: 'string',
                            ref: 'pTooltipStyle',
                            type: "string",
                            component: "textarea",
                            rows: 5,
                            maxlength: 4000,
                            defaultValue: 'color: #000000;\nbackground: #fbfbfb;\nborder-color: #333;\nwidth: 250px;',
                            expression: 'optional'
                        },
                        {
                            label: 'Hover Icon Text',
                            type: 'string',
                            ref: 'pHoverIconText',
                            defaultValue: '?',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode == 'hover' }
                        },
                        {
                            label: 'Hover Icon Custom CSS',
                            type: 'string',
                            ref: 'pHoverIconStyles',
                            type: "string",
                            component: "textarea",
                            rows: 4,
                            maxlength: 4000,
                            defaultValue: 'color: black;\nbackground: #d3d3d3;\ntop:-7px;',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode == 'hover' }
                        },
                        {
                            label: 'Text for Next button',
                            type: 'string',
                            ref: 'pTextNext',
                            defaultValue: 'Next',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        {
                            label: 'Text for Done button',
                            type: 'string',
                            ref: 'pTextDone',
                            defaultValue: 'Done',
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        {
                            label: 'Tooltip Button Styles',
                            type: 'string',
                            ref: 'pButtonStyles',
                            defaultValue: 'color:white;\nbackground: green;\nborder-color: green;',
                            component: "textarea",
                            rows: 5,
                            maxlength: 4000,
                            expression: 'optional',
                            show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        /*{
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
                        },*/ /*{
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
                            defaultValue: 1
                        },
                        // {
                        //     label: 'Default tooltip border color',
                        //     type: 'string',
                        //     ref: 'pTooltipBorderColor',
                        //     defaultValue: '#888888',
                        //     expression: 'optional'
                        // }
                    ])
                    , subSection('Advanced Settings', [
                        {
                            type: "boolean",
                            defaultValue: false,
                            ref: "pConsoleLog",
                            label: "console.log debugging info"
                        },
                        {
                            label: function (arg) { return 'Opacity of inactive objects: ' + arg.pOpacity },
                            type: 'number',
                            ref: 'pOpacity',
                            component: "slider",
                            defaultValue: 0.1,
                            min: 0.1,
                            max: 1,
                            step: 0.1
                            //show: function (arg) { return arg.pLaunchMode != 'hover' }
                        },
                        {
                            label: "Search SheetObjects",
                            component: "button",
                            action: function (arg, context) {
                                const app = qlik.currApp();
                                const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
                                // const enigma = app.model.enigmaModel;
                                findObjects.getSheetObjects(app, currSheet, guided_tour_global, context.properties.qInfo.qId);
                            }
                        }
                    ])
                ]
            }
        },

        licensing: function (app, guided_tour_global) {
            const enigma = app.model.enigmaModel;
            return {
                label: function (arg, context) {
                    return guided_tour_global.licensedObjs[context.properties.qInfo.qId] ? 'License (OK)' : 'License (unlicensed)'
                },
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
                        action: function (arg, context) {

                            const ownId = arg.qInfo.qId;
                            resolveProperty(arg.pLicenseJSON, enigma).then(function (lstr) {
                                const hostname = arg.pTestHostname ? (arg.pTestHostname.length > 0 ? arg.pTestHostname : location.hostname) : location.hostname;
                                const report = license.chkLicenseJson(lstr, 'db_ext_guided_tour', hostname, true);
                                tooltips.leonardoMsg(ownId, 'Result', report, null, 'OK');
                                $('#msgparent_' + ownId + ' th').css('text-align', 'left');
                                // make window wider
                                if (report.length > 200) $('#msgparent_' + ownId + ' .lui-dialog').css('width', '700px');
                            });
                            /*

                            */
                        }
                    }
                ]
            }
        },

        about: function (guided_tour_global) {
            return {
                label: 'About this extension',
                type: 'items',
                items: [
                    {
                        label: function (arg) { return 'Installed version: ' + guided_tour_global.qext.version },
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
                            window.open('https://insight.databridge.ch/items/guided-tour-extension', '_blank');
                        }
                    },
                    {
                        label: "Sheet Objects",
                        component: "button",
                        action: function (arg) {

                            const app = qlik.currApp();
                            const currSheet = qlik.navigation.getCurrentSheetId().sheetId;
                            app.getObject(currSheet)
                                .then((sheetObj) => sheetObj.getLayout())
                                .then((sheetLayout => {
                                    sheetObjects = [];
                                    console.log('Cells on sheet', currSheet, sheetLayout.cells);
                                    objectIds = [];
                                    sheetLayout.cells.forEach(o => objectIds.push(o.name));
                                    const objectPromises = objectIds.map(id => app.getObject(id).then(obj => obj.getProperties()));
                                    // Use Promise.all to wait for all promises to resolve

                                    Promise.all(objectPromises)
                                        .then(results => {
                                            results.forEach((properties, i) => {
                                                // console.log(`Properties for object ${objectIds[i]}:`, properties);
                                                sheetObjects.push(properties);
                                            });
                                            // Done here building a list of
                                            console.log(`Scanned ${objectIds.length} sheet objects.`, sheetObjects);

                                        })
                                        .catch(err => console.error('Error retrieving object properties:', err));
                                }))
                                .catch((err) => console.error(err))
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

    // function getDimNames(props, indexOrLabel) {
    //     // returns the labels/field names of the Dimension in this qHyperCubeDef as an array of {value: #, label: ""}
    //     var opt = [{ value: "", label: "- not assigned -" }];
    //     var i = -1;
    //     for (const dim of props.qHyperCubeDef.qDimensions) {
    //         i++;
    //         var label = dim.qDef.qFieldLabels[0].length == 0 ? dim.qDef.qFieldDefs[0] : dim.qDef.qFieldLabels[0];
    //         if (label.substr(0, 1) == '=') label = label.substr(1);
    //         if (i >= 2) opt.push({  // skip the first 2 dimensions
    //             value: indexOrLabel == 'label' ? label : i,
    //             label: label
    //         });
    //     }
    //     return opt;
    // }

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

    function registerEvents(arg, context, enigma, guided_tour_global, currSheet) {
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
                    // console.log('show pickers', Math.random());
                    picker.pickersOn(ownId, enigma, null, context.properties, guided_tour_global, currSheet, tooltips);
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
                        // clicked and open
                        if (context.properties.pConsoleLog) console.log('show pickers', Math.random());
                        picker.pickersOn(ownId, enigma, null, context.properties, guided_tour_global, currSheet, tooltips);

                    } else {
                        // clicked and closed
                        if (context.properties.pConsoleLog) console.log('hide pickers', Math.random());
                        picker.pickersOff(ownId);
                    }
                });

            // check all items if the selector is valid and mark the item with red background if not
            arg.pTourItems.forEach((tourItem, i) => {
                const selector = tourItem.selector.split(':').splice(-1)[0];
                const accordeonElem = $(`${ppSection}:nth-child(${domPos + 1}) li:nth-child(${i + 1}) ${ppNmDi_content}`);
                if ($(`[tid="${selector}"]`).length == 0) {
                    // The given selector of that tour item is invalid
                    accordeonElem.css('background', '#b98888').css('color', 'white');
                    if (selector in guided_tour_global.objAliases) {
                        // object was be found under a new tid
                        accordeonElem.css('background', 'orange').css('color', 'white');
                    }
                } else {
                    accordeonElem.css('background', '').css('color', '');
                }
            })

            // color the section headers of the "disabled tooltips" (those with showCond false)
            $(`${ppSection}:nth-child(${domPos + 1}) ${ppNmDi_content}`).each((i, e) => {
                if ([1, -1, '1', '-1'].indexOf(context.layout.pTourItems[i].showCond || -1) == -1) {
                    $(e).addClass('gt-disabled-item');
                } else {
                    $(e).removeClass('gt-disabled-item');
                }
            });

            // mouseover and mouseout events to highlight the object on the sheet that is behind this touritem

            $(`${ppSection}:nth-child(${domPos + 1}) ${ppNmDi_content}`)
                .not('[guided-tour-event="click"]')
                //.css('border', 'gray 1px solid')
                .attr('guided-tour-event', 'click') // add this attribute and the click event0
                .on('mouseover', function (e) {
                    const selector = $(e.currentTarget)[0].innerText.split(':').splice(-1)[0];
                    // const closestInput = $(e.currentTarget);//.closest('li').find('[tid="selector"] .label');
                    if (selector) {
                        $(`[tid="${selector}"]`).css('background-color', 'green');
                    }
                })
                .on('mouseout', function (e) {
                    const selector = $(e.currentTarget)[0].innerText.split(':').splice(-1)[0];
                    // const closestInput = $(e.currentTarget);//.closest('li').find('[tid="selector"] .label');
                    if (selector) {
                        $(`[tid="${selector}"]`).css('background-color', '');
                    }
                })
                .click(function (e) {
                    var expanded = true;
                    // figure out if the current item in the accordion is collapsed or expanded
                    if ($(e.currentTarget).closest(ppNmDi_header).length) {
                        if ($(e.currentTarget).closest(ppNmDi_header).hasClass('expanded')) expanded = false;
                    }
                    console.log('guided-tour-click-item', $(e.currentTarget)[0].innerText);
                    const itemTitle = $(e.currentTarget)[0].innerText;
                    const targetObjId = itemTitle.split(':').splice(-1)[0];
                    // const closestInput = $(e.currentTarget);//.closest('li').find('[tid="selector"] .label');
                    if (targetObjId) {
                        if (expanded) {
                            const itemPos = context.properties.pTourItems.findIndex(obj => obj.selector == itemTitle);
                            previewButtonClick(itemPos, context, enigma, guided_tour_global, currSheet);
                        } else {
                            tooltips.endTour(ownId, guided_tour_global, currSheet, context.properties)
                        }
                        // const elem = $(`[tid="${selector}"]`);
                        // if (elem.length) {

                        // const bgBefore = elem.css('background-color');
                        // elem.animate({
                        //     backgroundColor: expanded ? 'green' : 'yellow'
                        // }, 300, function () {
                        //     elem.css('background-color', bgBefore);
                        // });
                        // }
                    }
                });
        } else {
            // console.error('function registerEvents: Could not find out which position in accordeon menu is the "Tooltip Items" section')
        }
    }

    function pickerButtonClick(arg, context, enigma, guided_tour_global, currSheet) {

        // in the properties of Tooltip icons the Pick Object button was clicked.
        const inputRef = 'selector';  // property name 
        tooltips.endTour(context.properties.qInfo.qId, guided_tour_global, currSheet, context.properties, -2)

        var itemPos = getItemPos(arg, context);

        // find out if the button was previously pressed and the user is still in "pick-mode"
        // if ($('.guided-tour-picker').length > 0) {
        //     // end the pick-mode
        //     picker.pickersOff(context.properties.qInfo.qId);

        // } else {

        if (context.layout.pConsoleLog) console.log('You are within itemPos', itemPos);
        const domPos = getTourItemsSectionPos();
        if (domPos) {
            //console.log('found in DOM', domPos);
            const cssSelector = `${ppSection}:nth-child(${domPos + 1}) ${ppNmDi}:nth-child(${itemPos + 1}) [tid="${inputRef}"] input`;
            // console.log('cssSelector', cssSelector);
            if ($(cssSelector).length > 0) {
                picker.pickersOn(context.properties.qInfo.qId, enigma, itemPos, context.properties
                    , guided_tour_global, currSheet, tooltips);

            } else {
                alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', cssSelector);
            }
        } else {
            alert('Cannot find the "Tooltip Items" text in DOM model. Invalid css selector:', ppSection);
        }
        // }
    }

    function previewButtonClick(itemPos, context, enigma, guided_tour_global, currSheet) {

        // in the properties fof Tooltip icons the Preview Tooltip button was clicked.

        var isPreviewMode = true;
        // put current properties into tooltipsCache
        guided_tour_global.tooltipsCache[context.properties.qInfo.qId] = JSON.parse(JSON.stringify(context.layout.pTourItems));

        tooltips.play3(
            context.properties.qInfo.qId, context.layout, itemPos, false, enigma,
            guided_tour_global, currSheet, isPreviewMode
        );

    }
});

// tooltips.js: function play externalized 
// Test Dhruv
// Christof's comment
define(["qlik", "jquery", "./license", "./qlik-css-selectors", "./picker"], function
    (qlik, $, license, qlikCss, picker) {

    function isScrolledIntoView(elem) {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return elemTop >= docViewTop && elemBottom <= docViewBottom
    }


    function isQlikObjId(selector) {
        // returns true if the selector is a Qlik Object Id or false if it is a DOM selector (CSS)
        return selector.indexOf('#') == -1 && selector.indexOf('.') == -1 && selector.indexOf('=') == -1
            && selector.indexOf(' ') == -1;

    }

    function findPositions2(selector, rootContainer, tooltipSel, layout, bgColor, prefOrient) {

        // analyses and finds the best position for the given tooltip.

        const arrowHeadSize = layout.pArrowHead || 16;
        var leftOrRight = ['', 0];
        var topOrBottom = ['', 0];
        var arrowDiv = '';
        var orientation;
        const knownObjId = $(selector).length > 0;
        const screen = {
            width: $(rootContainer).width(),
            height: $(rootContainer).height()
        }

        // from the rendered tooltip the browser knows the height and width
        var tooltip = {
            width: $(tooltipSel).width(),
            height: $(tooltipSel).height(),
            left: '',
            right: '',
            top: '',
            bottom: ''
        }

        if (!knownObjId) {
            // css-selector of object doesn't exist in DOM, render the tooltip in the middle with no arrow
            tooltip.left = screen.width / 2 - tooltip.width / 2;
            tooltip.top = screen.height / 2 - tooltip.height / 2;

        } else {

            var target = $(selector).offset(); // this already sets target.left and target.top 
            target.height = $(selector).height();
            target.width = $(selector).width();
            target.right = screen.width - (target.left + target.width);  // pixels space between right edge of target and right edge of screen
            target.bottom = screen.height - (target.top + target.height); // pixels space between bottom edge of target and bottom of screen


            var pointTo;

            if (!prefOrient || ['h', 'l', 'r'].indexOf(prefOrient) > -1) {  // horizontal positioning (left or right) preferred

                // decide between Left or Right positioning, depending where there is more free space left.
                // if not enough free space to the left or right, then try "tb" (top or bottom)
                orientation = target.right > target.left ?
                    (target.right > tooltip.width ? 'r' : 'tb')
                    : (target.left > tooltip.width ? 'l' : 'tb');

                // if it is top or bottom orientati0on, decide depending on where there is more space left 
                if (orientation == 'tb') {
                    orientation = target.top > target.bottom ? 't' : 'b';
                }
            } else {  // vertical (top or bottom) positioning preferred
                // decide between top or bottom positioning, depending where there is more free space left.
                // if not enough free space to the left or right, then try "rl" (right or left)
                orientation = target.top > target.bottom ?
                    (target.top > tooltip.height ? 't' : 'rl')
                    : (target.bottom > tooltip.height ? 'b' : 'rl');

                // if it is right or left orientation, decide depending on where there is more space left 
                if (orientation == 'rl') {
                    orientation = target.right > target.left ? 'r' : 'l';
                }
            }

            if (orientation == 'l') {  // arrow will be to the right
                pointTo = { top: target.top + target.height / 2, left: target.left };
                tooltip.width += arrowHeadSize;
                tooltip.right = target.right + target.width + arrowHeadSize;
                tooltip.top = Math.min(Math.max(pointTo.top - tooltip.height / 2, 0), screen.height - tooltip.height - 10); // fix if bottom edge of tooltip would be below screen
                tooltip.arrow = `<div><div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0) ${layout.pTooltipBorderColor}; border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; right:${(-2 * arrowHeadSize + 1) - layout.pTooltipBorder}px; 
                        top:${pointTo.top - tooltip.top - arrowHeadSize}px">
                    </div>
                    <div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0) ${bgColor}; border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; right:${-2 * arrowHeadSize + 1}px; 
                        top:${pointTo.top - tooltip.top - arrowHeadSize}px">
                    </div></div>`;
            }

            if (orientation == 'r') { // arrow will be to the left
                pointTo = { top: target.top + target.height / 2, left: target.left + target.width };
                tooltip.width += arrowHeadSize;
                tooltip.left = Math.min(target.left + target.width + arrowHeadSize, screen.width - tooltip.width - 15);
                tooltip.top = Math.min(Math.max(pointTo.top - tooltip.height / 2, 0), screen.height - tooltip.height - 10);
                tooltip.arrow = `<div><div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) ${layout.pTooltipBorderColor} rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; left:${(-2 * arrowHeadSize + 1) - layout.pTooltipBorder}px; 
                        top:${pointTo.top - tooltip.top - arrowHeadSize}px">
                    </div>
                    <div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) ${bgColor} rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; left:${-2 * arrowHeadSize + 1}px; 
                        top:${pointTo.top - tooltip.top - arrowHeadSize}px">
                    </div></div>`;
            }

            if (orientation == 't' || orientation == 't!') {  // arrow will be at the buttom
                pointTo = { top: target.top, left: target.left + target.width / 2 };
                tooltip.height += arrowHeadSize;
                tooltip.top = Math.max(target.top - tooltip.height - arrowHeadSize, 0);
                tooltip.left = Math.min(Math.max(pointTo.left - tooltip.width / 2, 0), screen.width - tooltip.width - 15);
                tooltip.arrow = `<div><div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: ${layout.pTooltipBorderColor} rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; 
                        bottom:${(-2 * arrowHeadSize + 1) - layout.pTooltipBorder}px;">
                    </div>
                    <div class="guided-tour-arrowhead" orientation="${orientation}"
                       style="border-color: ${bgColor} rgba(0,0,0,0) rgba(0,0,0,0) rgba(0,0,0,0); border-style:solid; 
                       border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; 
                       bottom:${-2 * arrowHeadSize + 1}px;">
                    </div></div>`;
            }

            if (orientation == 'b' || orientation == 'b!') {  // arrow will be at the top
                pointTo = { top: target.top + target.height, left: target.left + target.width / 2 };
                tooltip.height += arrowHeadSize;
                tooltip.left = Math.min(Math.max(pointTo.left - tooltip.width / 2, 0), screen.width - tooltip.width - 15);
                tooltip.bottom = Math.max(target.bottom - tooltip.height - arrowHeadSize, 0);
                tooltip.arrow = `<div><div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) ${layout.pTooltipBorderColor} rgba(0,0,0,0); border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; 
                        top:${(-2 * arrowHeadSize + 1) - layout.pTooltipBorder}px;">
                    </div>
                    <div class="guided-tour-arrowhead" orientation="${orientation}"
                        style="border-color: rgba(0,0,0,0) rgba(0,0,0,0) ${bgColor} rgba(0,0,0,0); border-style:solid; 
                        border-width:${arrowHeadSize}px; position:absolute; left:${pointTo.left - tooltip.left - arrowHeadSize}px; 
                        top:${-2 * arrowHeadSize + 1}px;">
                    </div></div>`;
            }
        }

        if (tooltip.left) tooltip.left += 'px';
        if (tooltip.right) tooltip.right += 'px';
        if (tooltip.top) tooltip.top += 'px';
        if (tooltip.bottom) tooltip.bottom += 'px';
        tooltip.orient = orientation;

        console.log('orientation', orientation, tooltip);

        return tooltip;
    }

    function makeCssObject(styleAttribute) {
        var styleDeclarations = styleAttribute ? styleAttribute.split(';') : [];

        // Create an object to store the parsed CSS properties
        var cssObject = {};

        // Iterate over the array of style declarations
        styleDeclarations.forEach(function (declaration) {
            // Split each declaration into property and value
            var parts = declaration.split(':');
            if (parts.length === 2) {
                // Trim the property and value and add them to the cssObject
                cssObject[$.trim(parts[0])] = $.trim(parts[1]);
            }
        });
        return cssObject;
    }

    function rotateIcon(ownId) {
        $(`#${ownId}_rotate`).show();
        $(`#${ownId}_play`).hide();
    }

    function playIcon(ownId) {
        $(`#${ownId}_rotate`).hide();
        $(`#${ownId}_play`).show();
    }
    //    =========================================================================================
    function play3(ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal) {

        // console.log('play3(', ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal, ')');

        //=========================================================================================
        const arrowHeadSize = layout.pArrowHead || 16;
        const rootContainer = guided_tour_global.isSingleMode ? qlikCss.v(0).stageContainer : qlikCss.v(0).pageContainer;
        const finallyScrollTo = qlikCss.v(0).sheetTitle;
        const opacity = /*layout.pLaunchMode == 'hover' ? 1 :*/ (layout.pOpacity || 1);
        const licensed = guided_tour_global.licensedObjs[ownId];
        const isLast = tooltipNo >= (guided_tour_global.tooltipsCache[ownId].length - 1);

        if (!isPreviewMode) picker.pickersOff(ownId); // remove picker buttons if still rendered

        if (layout.pConsoleLog) {
            console.log(`${ownId} function play3, tooltip ${tooltipNo} (isLast ${isLast}, licensed ${licensed}, lStorageKey ${lStorageKey})`);
            console.log('activeTooltip:', guided_tour_global.activeTooltip[currSheet][ownId]);
        }

        if (reset) {  // end of tour

            function quitTour(fadeSpeed) {
                // unfade all cells, remove the current tooltip and reset the tours counter
                if (opacity < 1) $('.cell').fadeTo('fast', 1, () => { });
                $(`#${ownId}_tooltip`).fadeTo(fadeSpeed, 0, () => { $(`#${ownId}_tooltip`).remove() });
                guided_tour_global.activeTooltip[currSheet][ownId] = -2;
                guided_tour_global.tooltipsCache[ownId] = null;
                // stop rotating the play icon
                if (layout.pLaunchMode != 'hover') playIcon(ownId);
            }

            if (isLast) {
                // if (!licensed) {
                //     // alert(isPreviewMode);
                //     // after the last item of a tour, show databridge ad for a second
                //     if (!isPreviewMode) {
                //         $(`#${ownId}_tooltip`).children().css('opacity', 0);
                //         $(`#${ownId}_text`).after(`<div style="position:absolute; top:35%; color:${$('#' + ownId + '_next').css('color')}; width:100%; left:-3px; text-align:center; font-size:medium;">
                //         Tour sponsored by <a href="https://www.databridge.ch" target="_blank" style="color:${$('#' + ownId + '_next').css('color')};">data/\\bridge</a>
                //         </div>`);
                //     }
                // }
                function delay(time) {
                    return new Promise(resolve => setTimeout(resolve, time));
                }

                try {
                    if (!isScrolledIntoView(finallyScrollTo)) {
                        document.querySelector(finallyScrollTo).scrollIntoView({ behavior: "smooth" });  // scroll to the top
                    }
                }
                catch (err) { }
                delay(licensed || isPreviewMode ? 1 : 1000).then(() => quitTour('slow'));

            } else {
                quitTour('fast');
            }




        } else {
            // increase the tours counter and highlight next object

            // rotate the play icon
            if (layout.pLaunchMode != 'hover' && !isPreviewMode) rotateIcon(ownId);

            const prevElem = guided_tour_global.tooltipsCache[ownId][guided_tour_global.activeTooltip[currSheet][ownId]] ?
                guided_tour_global.tooltipsCache[ownId][guided_tour_global.activeTooltip[currSheet][ownId]] : null;
            guided_tour_global.activeTooltip[currSheet][ownId] = tooltipNo;

            const currElem = guided_tour_global.tooltipsCache[ownId][tooltipNo] ?
                guided_tour_global.tooltipsCache[ownId][tooltipNo] : null;

            if (prevElem) {
                $(`#${ownId}_tooltip`).remove();
            }

            if (currElem) {
                // for better readability of code get the hypercube page into variables
                // var qObjId = currElem[0].qText;
                var qObjId = currElem.selector.split(':').slice(-1)[0]; // use the text after : in the selector property

                var html = currElem.html;
                //const vizId = html.split(' ').length == 1 ? html : null; // instead of html text it could be an object id of a chart to be rendered
                const vizId = null;

                var tooltipStyle =
                    `width:${layout.pDefaultWidth}px;
                    color:${layout.pFontColor};
                    background-color:${layout.pBgColor};
                    border:${layout.pTooltipBorder}px solid ${layout.pTooltipBorderColor}`;
                // var tooltipCustomStyle = currElem.pCustomStyles;
                // if custom css added in the props then it will overwrite common css
                // var CurrTolltipStyle = !tooltipCustomStyle ? tooltipStyle : `width:${layout.pDefaultWidth}px;color:${layout.pFontColor};background-color:${layout.pBgColor};border:${layout.pTooltipBorder}px solid ${layout.pTooltipBorderColor}` + currElem.pCustomStyles;

                // var attr = {};
                // try {
                //     if (currElem[2]) attr = JSON.parse(currElem[2].qText);  // if there is a 3rd dimension it is the attribute dimension.
                //     //if (layout.pAttrFromDim && currElem[layout.pAttrFromDim]) attr = JSON.parse(currElem[layout.pAttrFromDim].qText);
                // } catch (err) { };
                // if (attr.css) CurrTolltipStyle += attr.css;
                var fontColor;
                var bgColor;
                var orientation = currElem.orientation || null;
                var dims;
                var selector;
                var selectorFormat; // will be "qlik-object", "qlik-container" or "css"
                var fadeSelector; // the object that needs to be focussed (is the grand-grand-grand...parent of the selector when "qlik-container")
                var knownObjId;
                var chart;

                if (isQlikObjId(qObjId)) {
                    // qlik object id format
                    //console.log(ownId + ' Qlik object:', qObjId);
                    selectorFormat = 'qlik-object';
                    selector = guided_tour_global.isSingleMode ? `[data-qid="${qObjId}"]` : `[tid="${qObjId}"]`;
                    fadeSelector = selector;
                    knownObjId = $(selector).length;

                } else if (qObjId.indexOf('[data-itemid=') > -1) {
                    selectorFormat = 'qlik-container';
                    selector = qObjId;
                    fadeSelector = '[tid="' + $(selector).closest('.cell').attr('tid') + '"]';  // find the parent with class "cell"
                    knownObjId = $(qObjId).length;
                    $(selector).trigger('click'); // click on the tab in the container

                } else {
                    // css selector format
                    //console.log(ownId + ' CSS selector format:', qObjId);
                    selectorFormat = 'css';
                    selector = qObjId;
                    fadeSelector = null;
                    knownObjId = $(qObjId).length;
                }


                function renderTooltip() {

                    if (knownObjId == 0) {
                        // target object does not exist, place object in the middle
                        if (opacity < 1) $('.cell').fadeTo('fast', opacity, () => { });

                    } else {
                        // target object exists && if != isPreviewMode
                        if (opacity < 1 && !isPreviewMode) {
                            $(fadeSelector).fadeTo('fast', 1, () => { });
                            $('.cell').not(fadeSelector).fadeTo('fast', opacity, () => { });
                        }

                        // save the time this object was rendered if in auto-once mode
                        if (layout.pLaunchMode == 'auto-once-p-obj' && lStorageKey && lStorageVal) {
                            enigma.evaluate("Timestamp(Now(),'YYYYMMDDhhmmss')") // get server time
                                .then(function (serverTime) {
                                    lStorageVal.objectsOpened[qObjId] = serverTime;
                                    window.localStorage.setItem(lStorageKey, JSON.stringify(lStorageVal));
                                    if (layout.pConsoleLog) console.log(ownId, 'Stored locally ', lStorageKey, JSON.stringify(lStorageVal));
                                });
                        }

                    }


                    // add the tooltip div

                    $(rootContainer).append(`
                    <div class="lui-tooltip  guided-tour-toolip-parent" id="${ownId}_tooltip" 
                        style="${tooltipStyle};display:none;position:absolute;">
                        <!--${selector}-->
                        <span style="opacity:${layout.pLaunchMode == 'hover' ? 0 : 0.6};">
                            ${tooltipNo + 1}/${guided_tour_global.tooltipsCache[ownId].length}
                        </span>
                        <span class="lui-icon  lui-icon--close" 
                            style="float:right;cursor:pointer;${layout.pLaunchMode == 'hover' && !isPreviewMode ? 'display:none;' : ''}" id="${ownId}_quit">
                        </span>
                        ${knownObjId == 0 ? '<br/><div class="guided-tour-err">Object <strong>' + qObjId + '</strong> not found!</div>' : '<br/>'}
                        ${knownObjId > 1 ? '<br/><div class="guided-tour-err"><strong>' + qObjId + '</strong> selects ' + knownObjId + ' objects!</div>' : '<br/>'}
                        <div style="margin-top:10px;" id="${ownId}_text">
                        	${vizId ? '<!--placeholder for chart-->' : html}
                        </div>
                        <${licensed ? '!--' : ''}div class="guided-tour-ad">
                            &#x73;p&#x6f;n&#x73;o&#x72;e&#x64;&nbsp;&#x62;y&nbsp;
                            <a href="https://www.databridge.ch" target="_blank">
                                &#x64;a&#x74;a&#x2f;&#x5c;b&#x72;i&#x64;g&#x65;
                            </a>
                        </div${licensed ? '--' : ''}>
                        <a class="lui-button  guided-tour-next" 
                            style="${layout.pLaunchMode == 'hover' ? 'opacity:0;' : ''}" id="${ownId}_next">
                            ${isLast ? layout.pTextDone : layout.pTextNext}
                        </a>
                        <div class="lui-tooltip__arrow"></div>
                    </div>`);
                    // add possible more styles
                    $(`#${ownId}_tooltip`).css(makeCssObject(currElem.pCustomStyles));

                    if (vizId) {
                        const app = qlik.currApp();

                        $(`#${ownId}_text`).css('height', ($(`#${ownId}_tooltip`).height() - 90) + 'px');
                        // https://help.qlik.com/en-US/sense-developer/June2020/Subsystems/APIs/Content/Sense_ClientAPIs/CapabilityAPIs/VisualizationAPI/get-method.htm
                        app.visualization.get(vizId).then(function (viz) {
                            viz.show(ownId + '_text');
                        }).catch(function (err3) {
                            console.error(err3);
                            $(`#${ownId}_text`).html('Error getting object ' + vizId + ':' + JSON.stringify(err3))
                        })
                    }


                    // get the current colors, because the attribute-dimension can overrule the first color and background-color style setting
                    fontColor = $(`#${ownId}_tooltip`).css('color');
                    bgColor = $(`#${ownId}_tooltip`).css('background-color');
                    $(`#${ownId}_next`).css('color', fontColor); // set the a-tag button's font color

                    // register click trigger for "X" (quit) and Next/Done button
                    $(`#${ownId}_quit`).click(() => {
                        if (layout.pLaunchMode == 'hover') {
                            $(`#${ownId}_tooltip`).remove()
                        }
                        else {
                            play3(ownId, layout, tooltipNo, true, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal)
                        }
                    });
                    $(`#${ownId}_next`).click(() => {
                        play3(ownId, layout, tooltipNo + 1, isLast, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal)
                    });

                    const calcPositions = findPositions2(selector, rootContainer, `#${ownId}_tooltip`, layout, bgColor, orientation);

                    $(`#${ownId}_tooltip`)
                        .css('left', calcPositions.left).css('right', calcPositions.right)  // left or right
                        .css('top', calcPositions.top).css('bottom', calcPositions.bottom)  // top or bottom
                        .attr('orient', calcPositions.orient);
                    if (calcPositions.arrow) $(`#${ownId}_tooltip .lui-tooltip__arrow`).after(calcPositions.arrow);  // arrowhead

                    $(`#${ownId}_tooltip`).show();
                }

                if (knownObjId) {
                    if (!isScrolledIntoView(selector)) {
                        document.querySelector(selector).scrollIntoView({ behavior: "smooth" }); // scroll to the element
                        var interval;
                        // guided_tour_global.tmpTop = [$(selector).offset().top];
                        var tmpTop = [$(selector).offset().top];
                        interval = setInterval(function () {
                            tmpTop.push($(selector).offset().top);
                            tmpTop = tmpTop.splice(-3); // keep the last 3 top offsets
                            // console.log(JSON.stringify(tmpTop));
                            if (tmpTop.length == 3 && tmpTop[0] == tmpTop[1] && tmpTop[1] == tmpTop[2]) {
                                // console.log('No more scrolling');
                                clearInterval(interval);

                                // if (isScrolledIntoView(selector)) {
                                //     clearInterval(interval);
                                //     console.log('selector is in the view', selector)
                                renderTooltip();
                            } else {
                                // console.log('still waiting for', selector)
                            }
                        } // recalc every 50 milliseconds
                            , 50);
                    } else {
                        renderTooltip();
                    }
                } else {
                    renderTooltip();
                }
            }
        }
    }

    function endTour(ownId, guided_tour_global, currSheet, layout, resetTo) {
        // ends the given tour
        $(`#${ownId}_tooltip`).remove();
        if (guided_tour_global.activeTooltip[currSheet]) {
            guided_tour_global.activeTooltip[currSheet][ownId] = resetTo || -2;
        }
        if ((layout.pOpacity || 1) < 1) $('.cell').fadeTo('fast', 1, () => { });
        playIcon(ownId);
    }

    function leonardoMsg(ownId, title, detail, ok, cancel, inverse) {
        //console.log('leonardoMsg', ownId, title, detail, ok, cancel, inverse);
        // This html was found on https://qlik-oss.github.io/leonardo-ui/dialog.html
        if ($('#msgparent_' + ownId).length > 0) $('#msgparent_' + ownId).remove();

        var html = '<div id="msgparent_' + ownId + '">' +
            '  <div class="lui-modal-background"></div>' +
            '  <div class="lui-dialog' + (inverse ? '  lui-dialog--inverse' : '') + '" style="width: 400px;top:80px;">' +
            '    <div class="lui-dialog__header">' +
            '      <div class="lui-dialog__title">' + title + '</div>' +
            '    </div>' +
            '    <div class="lui-dialog__body">' +
            detail +
            '    </div>' +
            '    <div class="lui-dialog__footer">';
        if (cancel) {
            html +=
                '  <button class="lui-button  lui-dialog__button' + (inverse ? '  lui-button--inverse' : '') + '" ' +
                '   onclick="$(\'#msgparent_' + ownId + '\').remove();">' +
                cancel +
                ' </button>'
        }
        if (ok) {
            html +=
                '  <button class="lui-button  lui-dialog__button  ' + (inverse ? '  lui-button--inverse' : '') + '" id="msgok_' + ownId + '">' +
                ok +
                ' </button>'
        };
        html +=
            '     </div>' +
            '  </div>' +
            '</div>';

        $("#qs-page-container").append(html);
        // fix for Qlik Sense > July 2021, the dialog gets rendered below the visible part of the screen
        if ($('#msgparent_' + ownId + ' .lui-dialog').position().top > 81) {
            $('#msgparent_' + ownId + ' .lui-dialog').css({
                'top': (-$('#msgparent_' + ownId + ' .lui-dialog').position().top + 100) + 'px'
            });
        }
    } // end function leonardoMsg



    return {

        play3: function (ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal) {
            play3(ownId, layout, tooltipNo, reset, enigma, guided_tour_global, currSheet, isPreviewMode, lStorageKey, lStorageVal);
        },

        leonardoMsg: function (ownId, title, detail, ok, cancel, inverse) {
            leonardoMsg(ownId, title, detail, ok, cancel, inverse);
        },

        findPositions2: function (selector, rootContainer, tooltipSel, layout, bgColor, orient) {
            return findPositions2(selector, rootContainer, tooltipSel, layout, bgColor, orient);
        },

        playIcon: function (ownId) {
            return playIcon(ownId)
        },

        endTour: function (ownId, guided_tour_global, currSheet, layout, resetTo) {
            return endTour(ownId, guided_tour_global, currSheet, layout, resetTo)
        }
    }
})

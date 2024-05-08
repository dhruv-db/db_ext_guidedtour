define(["jquery"], function ($) {

    const stylesRemove = { background: 'white', color: 'gray', cursor: 'pointer' }
    const stylesAdd = { background: 'white', color: 'green', cursor: 'pointer' }
    const stylesSelf = { background: 'orange', color: 'white', cursor: 'pointer' }


    function pickerDiv(id, ref) {
        return `
            <div id="guided-tour-picker-${id}" class="guided-tour-picker" ref="${ref}">
                <span id="guided-tour-picker-${id}-close" style="display:none;" 
                    class="lui-icon  lui-icon--close" title="close the + and - icons">
                </span>
                <span id="guided-tour-picker-${id}-add" style="display:none;" 
                    class="lui-icon  lui-icon--plus" title="add this object to guided tour">
                </span>
                <span id="guided-tour-picker-${id}-remove" style="display:none;" 
                    class="lui-icon  lui-icon--minus" title="remove this object from guided tour">
                </span>
                <span id="guided-tour-picker-${id}-counter" class="guided-tour-counter"></span>
            </div>`;
    }

    function pickersOff(ownId, guided_tour_global) {
        $('.guided-tour-picker').remove(); // remove previous divs
    }


    function pickersRefresh(ownId, pTourItems) {
        if ($('.guided-tour-picker').length) {

            const posCorr = $(`[tid="${ownId}"]`).offset();
            var selectorsIndex = {};

            pTourItems.forEach(function (tourItem, i) {
                if (tourItem.selector) {
                    selectorsIndex[tourItem.selector.split(':').slice(-1)[0]] = i
                }
            });

            // console.log('pickersRefresh', selectorsIndex);

            $('.guided-tour-picker').each(function (i, e) {

                const pickerId = $(e).attr('id');
                const selector = $(e).attr('ref');
                const foundTourItem = selectorsIndex[selector];
                const referToObj = $(`[tid="${selector}"]`);
                // console.log('picker', pickerId, selector, foundTourItem);

                if (referToObj.length) {
                    // update the absolute position of the picker
                    $(`#${pickerId}`).css({
                        top: $(`[tid="${selector}"]`).offset().top - posCorr.top,
                        left: $(`[tid="${selector}"]`).offset().left - posCorr.left
                    })
                } else {
                    // the referred-to object is no longer in DOM, remove the picker
                    $(`#${pickerId}`).remove()
                }

                if (selector != ownId) {
                    if (foundTourItem != undefined) {
                        $(`#${pickerId}`)
                            .removeClass('guided-tour-selficon guided-tour-addicon')
                            .addClass('guided-tour-removeicon');
                        $(`#${pickerId}-add`).hide();
                        $(`#${pickerId}-remove`).show();
                        $(`#${pickerId}-counter`).html(foundTourItem + 1);
                    } else {
                        $(`#${pickerId}`)
                            .removeClass('guided-tour-selficon guided-tour-removeicon')
                            .addClass('guided-tour-addicon');
                        $(`#${pickerId}-add`).show();
                        $(`#${pickerId}-remove`).hide();
                        $(`#${pickerId}-counter`).html('');
                    }
                }
            })
        }
    }

    return {

        pickersOff: function (ownId) {
            pickersOff(ownId);
        },

        pickersOn: function (ownId, enigma, itemPos, pTourItems) {

            pickersOff(ownId); // remove previous divs
            var position = itemPos || pTourItems.length + 1;
            const posCorr = $(`[tid="${ownId}"]`).offset();

            const addOrRemoveObj = function (objTid, ownId, enigma, i) {

                // function to handle the click event of the picker (+) or (-)

                const objType = $(`[tid="${objTid}"] article`).attr('tid').replace('qv-object-', '');
                var action = '';

                console.log('picked object', objType, objTid);

                enigma.getObject(ownId).then(obj => {
                    obj.getProperties().then(prop => {
                        //const addObj = true
                        const alreadyInTour = prop.pTourItems
                            .filter(i => i.selector.split(':').slice(-1)[0] != objTid).length
                            < prop.pTourItems.length;
                        if (alreadyInTour) {
                            // remove item from prop.pTourItems array
                            action = 'removed';
                            prop.pTourItems = prop.pTourItems
                                .filter(i => i.selector.split(':').slice(-1)[0] != objTid);

                        } else {
                            // add item to prop.pTourItems array
                            action = 'added';
                            if ((position + 1) <= prop.pTourItems.length) {
                                prop.pTourItems[itemPos].selector = `${objType}:${objTid}`
                                if (!prop.pTourItems[itemPos].html) {
                                    prop.pTourItems[itemPos].html = `This ${objType} is ...`
                                }
                            } else {
                                prop.pTourItems.push({
                                    selector: `${objType}:${objTid}`,
                                    html: `This ${objType} is ...`,
                                    pCustomStyles: '',
                                    orientation: ''
                                })
                            }
                            position = prop.pTourItems.length
                        }
                        // save the changed properties (array of tooltips is now shorter)
                        obj.setProperties(prop);
                        pickersRefresh(ownId, prop.pTourItems)

                    })
                        .catch(e => { console.error(e); })
                })
                    .catch(e => { console.error(e); })

            }

            $(".cell") // root DOM element for all grid cells of Qlik Sense client
                // .not(`[tid="${ownId}"]`)
                .each(function (i, e) {
                    const objTid = $(e).attr('tid');
                    if (objTid) {

                        // Add a div that will be the PICK button 
                        $(`[tid="${ownId}"]`)
                            .prepend(pickerDiv(i, objTid));

                        // $(`#guided-tour-picker-${i}`).css({
                        //     top: $(e).offset().top - posCorr.top,
                        //     left: $(e).offset().left - posCorr.left,
                        // })
                        if (objTid == ownId) {
                            // This object is the current tour itself
                            $(`#guided-tour-picker-${i}-close`).show();
                            $(`#guided-tour-picker-${i}`)
                                .addClass('guided-tour-selficon')
                                .click(() => pickersOff(ownId));
                        } else {
                            // this obj gets a (+) or (-) icon and event
                            $(`#guided-tour-picker-${i}`)
                                .click(() => { addOrRemoveObj(objTid, ownId, enigma, i) })
                        }
                        /*
                                                const alreadyInTour = searchIds.indexOf(`:${objTid}"`) > -1 || searchIds.indexOf(`"${objTid}"`) > -1;
                                                if (objTid == ownId) {
                                                    // This object is the current tour itself
                                                    $(`#guided-tour-picker-${i}`)
                                                        .css(stylesSelf)
                                                        // .html(divSelf().html)
                                                        // .css(divSelf().css)
                                                        
                                                    $(`#guided-tour-picker-${i}-close`).show();
                                                } else {
                        
                                                    $(`#guided-tour-picker-${i}`)
                                                        // .html(alreadyInTour ? divRemove().html : divAdd().html)
                                                        // .css(alreadyInTour ? divRemove().css : divAdd().css)
                                                        .click(() => {
                                                            addOrRemoveObj(objTid, ownId, enigma, i);
                                                        })
                                                    if (alreadyInTour) {
                                                        $(`#guided-tour-picker-${i}`).css(stylesRemove);
                                                        $(`#guided-tour-picker-${i}-add`).hide();
                                                        $(`#guided-tour-picker-${i}-remove`).show();
                                                    } else {
                                                        $(`#guided-tour-picker-${i}`).css(stylesAdd);
                                                        $(`#guided-tour-picker-${i}-add`).show();
                                                        $(`#guided-tour-picker-${i}-remove`).hide();
                                                    }
                                                }
                                                */
                        pickersRefresh(ownId, pTourItems)
                    }
                })
        },

        pickersRefresh: function (ownId, pTourItems) {
            pickersRefresh(ownId, pTourItems)
        }

    };
});

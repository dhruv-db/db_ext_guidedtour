define(["jquery"], function ($) {

    // const stylesRemove = { background: 'white', color: 'gray', cursor: 'pointer' }
    // const stylesAdd = { background: 'white', color: 'green', cursor: 'pointer' }
    // const stylesSelf = { background: 'orange', color: 'white', cursor: 'pointer' }


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

        pickersOn: function (ownId, enigma, itemPos, layout, guided_tour_global, currSheet, tooltipsJs) {

            // itemPos is an optional argument: it is the position within the pTourItems array 
            // that the first added object's tid (where (+) is clicked) gets added to. If this is
            // missing

            var pTourItems = layout.pTourItems;
            pickersOff(ownId); // remove previous divs

            tooltipsJs.endTour(ownId, guided_tour_global, currSheet, layout, -2)
            $('.guided-tour-helpicon').remove();

            var position = typeof itemPos == 'number' ? itemPos : (pTourItems.length + 1);
            const posCorr = $(`[tid="${ownId}"]`).offset();

            const addOrRemoveObj = function (objTid, ownId, enigma, i) {

                // function to handle the click event of the picker (+) or (-)

                const objType = $(`[tid="${objTid}"] article`).attr('tid').replace('qv-object-', '');
                var action = '';

                console.log('picked object', objType, objTid);

                enigma.getObject(ownId).then(obj => {
                    obj.getProperties().then(prop => {
                        //const addObj = true
                        const otherItems = prop.pTourItems.filter((i) => {
                            return i.selector ? (i.selector.split(':').slice(-1)[0] != objTid) : true
                        });
                        if (otherItems.length < prop.pTourItems.length) {
                            // remove item from prop.pTourItems array
                            action = 'removed';
                            prop.pTourItems = prop.pTourItems
                                .filter(i => i.selector.split(':').slice(-1)[0] != objTid);
                            // remove also the helper-icon if rendered
                            $(`[tid="${objTid}"] .guided-tour-helpicon-${ownId}`).remove();

                        } else {
                            // add to, or update item in prop.pTourItems array
                            action = 'added';
                            var addAtPos; // position to be determined
                            if ((position + 1) <= prop.pTourItems.length) {
                                prop.pTourItems[itemPos].selector = `${objType}:${objTid}`
                                addAtPos = itemPos;
                            } else {
                                // look if there is an item with an empty 
                                const i = prop.pTourItems.findIndex((e) => e.selector.length == 0);
                                if (i > -1) {
                                    addAtPos = i;
                                } else {
                                    // add item as a new item to pTourItems array
                                    prop.pTourItems.push({});
                                    addAtPos = prop.pTourItems.length - 1;
                                }
                                prop.pTourItems[addAtPos] = {
                                    selector: `${objType}:${objTid}`,
                                    html: prop.pTourItems[addAtPos].html || `This ${objType} is ...`,
                                    showCond: prop.pTourItems[addAtPos].showCond || { qStringExpression: { qExpr: "=1" } }
                                }
                            }

                            position = prop.pTourItems.length
                        }
                        // save the changed properties (array of tooltips is now changed)
                        obj.setProperties(prop);
                        enigma.getObject(objTid).then(obj2 => {
                            obj2.getProperties().then(prop2 => {
                                if (!Array.isArray(prop2.guidedTourAliases)) prop2.guidedTourAliases = [];
                                if (prop2.guidedTourAliases.indexOf(objTid) == -1) prop2.guidedTourAliases.push(objTid);
                                obj2.setProperties(prop2)
                                    .then(() => console.log('patched object', objTid))
                                    .catch(err => console.error(err));
                            })
                        })
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
                        pickersRefresh(ownId, pTourItems)
                    }
                })
        },

        pickersRefresh: function (ownId, pTourItems) {
            pickersRefresh(ownId, pTourItems)
        }

    };
});

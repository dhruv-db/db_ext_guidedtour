define(["jquery"], function ($) {

    const divUsed = {
        html: "used",
        css: { background: 'gray', color: 'white', cursor: '' }
    };
    const divPick = {
        html: "+add",
        css: { background: 'green', color: 'white', cursor: 'pointer' }
    }
    const divSelf = {
        html: "done",
        css: { background: 'orange', color: 'white', cursor: 'pointer' }
    };

    function pickerDiv(classes, id) {
        return `<div id="${id}" class="${classes}"
            style="position:absolute; z-index:100; border-radius: 10px; 
            padding: 0 10px; height: 20px; line-height:20px;"></div>`;
    }

    function pickersOff(ownId) {
        $('.guided-tour-picker').remove(); // remove previous divs
    }

    return {

        pickersOff: function (ownId) {
            pickersOff(ownId);
        },

        pickMany: function (ownId, enigma, itemPos, pTourItems) {

            pickersOff(ownId); // remove previous divs
            var position = itemPos;
            const posCorr = $(`[tid="${ownId}"]`).offset();
            const searchIds = JSON.stringify(pTourItems);

            $(".cell") // root DOM element for all grid cells of Qlik Sense client
                // .not(`[tid="${ownId}"]`)
                .each(function (i, e) {
                    const objTid = $(e).attr('tid');
                    if (objTid) {

                        // Add a div that will be the PICK button 
                        $(`[tid="${ownId}"]`)
                            .prepend(pickerDiv('guided-tour-picker', `guided-tour-picker-${i}`));
                        $(`#guided-tour-picker-${i}`).css({
                            top: $(e).offset().top - posCorr.top,
                            left: $(e).offset().left - posCorr.left,
                        })
                        const alreadyInTour = searchIds.indexOf(`:${objTid}"`) > -1 || searchIds.indexOf(`"${objTid}"`) > -1;
                        if (objTid == ownId) {
                            // This object is the current tour itself
                            $(`#guided-tour-picker-${i}`)
                                .html(divSelf.html)
                                .css(divSelf.css)
                                .click(function () {
                                    $(".guided-tour-picker").remove();
                                })
                        } else if (!alreadyInTour) {
                            // This is an object that is not yet in the pTourItems
                            $(`#guided-tour-picker-${i}`)
                                .html(divPick.html)
                                .css(divPick.css)
                                .click(function () {
                                    const objType = $(`[tid="${objTid}"] article`).attr('tid').replace('qv-object-', '');
                                    console.log('picked object', objType, objTid);

                                    enigma.getObject(ownId).then(obj => {
                                        obj.getProperties().then(prop => {
                                            // prop.pTourItems.forEach((tourItem, i) => {
                                            //     if (tourItem.selector.split(':').slice(-1)[0] == objTid) position = i;
                                            // })
                                            // console.log(`obj ${objTid} is found at tourItem ${position}`);
                                            if ((position + 1) <= prop.pTourItems.length) {
                                                prop.pTourItems[itemPos].selector = `${objType}:${objTid}`
                                                if (!prop.pTourItems[itemPos].html) { prop.pTourItems[itemPos].html = `This ${objType} is ...` }
                                            } else {
                                                prop.pTourItems.push({
                                                    selector: `${objType}:${objTid}`,
                                                    html: `This ${objType} is ...`,
                                                    pCustomStyles: ''
                                                })
                                            }
                                            position = prop.pTourItems.length
                                            obj.setProperties(prop);
                                        })
                                            .catch(e => { console.error(e); })
                                    })
                                        .catch(e => { console.error(e); })
                                    // $(".guided-tour-picker").remove();
                                    $(`#guided-tour-picker-${i}`)
                                        .html(divUsed.html)
                                        .css(divUsed.css)
                                        .unbind('click')
                                })
                        } else {
                            // this object was already picked (is part of pTourItems)
                            $(`#guided-tour-picker-${i}`)
                                .html(divUsed.html)
                                .css(divUsed.css)
                        }
                    }
                })
        }
    };
});

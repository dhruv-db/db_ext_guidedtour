
define(["jquery"], function ($) {

    return {
        //fixItemArray: function();
        getSheetObjects: function (app, currSheet, guided_tour_global) {
            app.getObject(currSheet)
                .then((sheetObj) => sheetObj.getLayout())
                .then((sheetLayout => {
                    console.log('Objects on sheet', currSheet, sheetLayout.cells);
                    objectIds = [];
                    sheetLayout.cells.forEach(o => objectIds.push(o.name));
                    const objectPromises = objectIds.map(id => app.getObject(id).then(obj => obj.getProperties()));
                    // Use Promise.all to wait for all promises to resolve
                    objAliases = {};
                    Promise.all(objectPromises)
                        .then(results => {
                            results.forEach((properties, i) => {
                                // console.log(`Properties for object ${objectIds[i]}:`, properties);
                                if (properties.guidedTourAliases) {
                                    properties.guidedTourAliases.forEach(alias => {
                                        if (alias != objectIds[i]) objAliases[alias] = objectIds[i]
                                    })
                                }
                            });
                            // Done here building a list of
                            console.log(`Scanned ${objectIds.length} sheet objects and found these aliases`, objAliases);
                            guided_tour_global.objAliases = { ...guided_tour_global.objAliases, ...objAliases };
                        })
                        .catch(err => console.error('Error retrieving object properties:', err));
                }))
                .catch((err) => console.error(err))
        }
    }
})

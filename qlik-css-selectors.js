define([], function () {
    // returns the necessary css selectors for the Qlik Client
    return {
        v: function (version) {
            return {
                ppSection: ".pp-section", // class for accordeons top <div>
                ppNmDi: '.pp-nm-di', // class for sub-accordeons <li>
                ppNmDi_header: '.pp-nm-di__header',
                ppNmDi_content: '.pp-nm-di__header-content', // class for <div> inside cssSel2 that should get the click event
                stageContainer: '#qv-stage-container', // root element in "single.html" mode of Sense Client
                pageContainer: '#qv-page-container', // root element in Sense Client (standard analysis or edit mode)
                sheetTitle: '#sheet-title',
                innerObject: '.qv-inner-object', // class in the childs of <article> tag 
                accordionHeaderCollapsed: 'ui-accordion-header-collapsed' // class of the <h4> tag of accordean menu when it is closed
            }
        }
    }
})

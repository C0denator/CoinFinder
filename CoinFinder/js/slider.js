window.addEventListener("load", InitSliders);

function InitSliders(){
    // Alle Slider-Container selektieren
    const sliderContainers = document.querySelectorAll('.sliderContainer');

    sliderContainers.forEach(container => {
        const sliderElement = container.querySelector('.slider');
        const valueElement = container.querySelector('.sliderValue');

        const min = parseFloat(container.dataset.min);
        const max = parseFloat(container.dataset.max);
        const step = parseFloat(container.dataset.step);
        const var1 = container.dataset.var1;
        const var2 = container.dataset.var2;
        const isRange = container.dataset.range === "true"; // Überprüft, ob Bereichsmodus aktiv ist
        console.log("Data for slider: min: " + min + " max: " + max + " step: " + step + " var1: " + var1 + " var2: " + var2 + " isRange: " + isRange);

        // Startwerte auslesen
        let startValues = [];
        if (isRange) {
            // Bereichsmodus: Startwerte aus den <span>-Elementen lesen
            const spanValues = valueElement.querySelectorAll('span');
            startValues = Array.from(spanValues).map(span => parseFloat(span.textContent));
            if (startValues.length !== 2) {
                // Fallback: Standardwerte in der Mitte des Bereichs
                startValues = [min + (max - min) / 3, max - (max - min) / 3];
            }
        } else {
            // Einzelregler: Einzelwert auslesen
            startValues = [parseFloat(valueElement.textContent) || (min + max) / 2];
        }

        // Slider erstellen
        noUiSlider.create(sliderElement, {
            start: startValues,
            range: {
                'min': min,
                'max': max
            },
            step: step,
            connect: isRange ? true : [true, false] // Verbindet die Regler bei Range-Modus
        });

        // Update-Event
        sliderElement.noUiSlider.on('update', (values, handle) => {
            if (isRange) {
                // Bereichsmodus: Werte in <span>-Elementen aktualisieren
                if(step >= 1){
                    const spanValues = valueElement.querySelectorAll('span');
                    spanValues[handle].textContent = Math.round(values[handle]);
                }else{
                    const spanValues = valueElement.querySelectorAll('span');
                    spanValues[handle].textContent = values[handle];
                }

                //TODO: Beide Variablen aktualisieren
                if(var1 !== undefined && var2 !== undefined){
                    UpdateVariable(var1, values, 0);
                    UpdateVariable(var2, values, 1);
                }else{
                    console.log("var1 or var2 is undefined. Slider will not change any variables");
                }


            } else {
                // Einzelregler: Textinhalt aktualisieren
                if(step >= 1){
                    valueElement.textContent = Math.round(values[handle]);
                }else{
                    valueElement.textContent = values[handle];
                }

                if(var1 !== undefined){
                    // Variable aktualisieren
                    UpdateVariable(var1, values, handle);
                }else{
                    console.log("var1 is undefined. Slider will not change any variables");
                }

            }
        });
    });
}

function UpdateVariable(varName, values, handle){
    //check if variable exists
    if (eval('typeof ' + varName) === 'undefined') {
        console.warn('Variable '+varName+' does not exist');
        return;
    }

    //update variable
    if(eval('typeof ' + varName) === 'number'){
        eval(varName + ' = ' + parseFloat(values[handle]));
    }else if(eval('typeof ' + varName) === 'string'){
        eval(varName + ' = ' + values[handle]);
    }

    console.log("minRadius " + minRadius + " maxRadius " + maxRadius + " dp " + dp + " param1 " + param1 + " param2 " + param2);
}
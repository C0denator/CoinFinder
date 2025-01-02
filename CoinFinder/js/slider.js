window.addEventListener("load", () => {
    InitSliders();
});

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
        //console.log("Data for slider: min: " + min + " max: " + max + " step: " + step + " var1: " + var1 + " var2: " + var2 + " isRange: " + isRange);

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

        SetSliderValueFromCookie(container.id);

        // Update-Event
        sliderElement.noUiSlider.on('update', (values, handle) => {
            if (isRange) {
                // Bereichsmodus: Werte in <span>-Elementen aktualisieren
                if(step >= 1){
                    valueElement.textContent = values.map(value => Math.round(value)).join(' - ');
                }else{
                    valueElement.textContent = values.map(value => value).join(' - ');
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

            // Cookie setzen
            SetSliderCookie(container.id, values);
        });
    });

    console.log("Sliders initialized");
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
}

function GetSliderCookie(){
    const value = `; ${document.cookie}`;
    const parts = value.split(`; sliderValues=`);
    if (parts.length === 2) {
        const cookieValue = parts.pop().split(';').shift();
        return JSON.parse(cookieValue);  // Parsen des JSON-Strings
    }
    return {};  // Falls der Cookie nicht existiert, ein leeres Objekt zurückgeben
}

function SetSliderCookie(sliderId, value) {
    // Holen des bestehenden Cookie-Werts
    let sliderValues = GetSliderCookie();

    // Setze den Wert des Sliders im Cookie
    sliderValues[sliderId] = value;

    // Setze den Cookie mit den neuen Werten
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // Cookie läuft in 7 Tagen ab
    document.cookie = `sliderValues=${JSON.stringify(sliderValues)}; expires=${expires.toUTCString()}; path=/;`;
}

function SetSliderValueFromCookie(containerID){
    const sliderValues = GetSliderCookie();
    const sliderContainer = document.getElementById(containerID);

    if (!sliderContainer) {
        console.error('Slider container not found');
        return;
    }

    const slider = sliderContainer.querySelector('.slider');
    const sliderValueElement = sliderContainer.querySelector('.sliderValue');

    if (!slider || !sliderValueElement) {
        console.error('Slider or value element not found');
        return;
    }

    const savedValue = sliderValues[containerID];

    if (savedValue !== undefined) {
        // Den Slider auf den gespeicherten Wert setzen
        slider.noUiSlider.set(savedValue);

        // Anzeige des aktuellen Werts aktualisieren
        sliderValueElement.textContent = Array.isArray(savedValue) ? savedValue.join(' - ') : savedValue;
    }else{
        console.log("No saved value for " + containerID + " found in cookie");
    }
}
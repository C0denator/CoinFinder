// Alle Slider-Container selektieren
const sliderContainers = document.querySelectorAll('.sliderContainer');

sliderContainers.forEach(container => {
    const sliderElement = container.querySelector('.slider');
    const valueElement = container.querySelector('.sliderValue');
    const min = parseFloat(container.dataset.min);
    const max = parseFloat(container.dataset.max);
    const step = parseFloat(container.dataset.step);
    const isRange = container.dataset.range === "true"; // Überprüft, ob Bereichsmodus aktiv ist

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

        } else {
            // Einzelregler: Textinhalt aktualisieren
            if(step >= 1){
                valueElement.textContent = Math.round(values[handle]);
            }else{
                valueElement.textContent = values[handle];
            }

        }
    });
});
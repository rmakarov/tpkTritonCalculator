
import { BaseCalculator } from './baseCalculator.js';

/**
 * Калькулятор калитки
 */
class WicketCalculator extends BaseCalculator {
    constructor(rootElement, priceManager) {
        super(rootElement, priceManager);
    }

        calculateRawMaterials() {
        const materials = [];
        
        // 1. Получаем размеры в миллиметрах из выпадающего списка
        const widthMm = parseFloat(this.getVal('#wicket-width')) || 0;
        const heightMm = parseFloat(this.getVal('#wicket-height')) || 0;

        // ВАЖНО: Проверяем, выбрал ли пользователь размеры (защита от пустого placeholder)
        if (widthMm === 0 || heightMm === 0) {
            this.showNotification("Пожалуйста, выберите ширину и высоту калитки!");
        }

        // 2. Конвертируем в метры для инженерных расчетов
        const width = widthMm / 1000;
        const height = heightMm / 1000;

        // 3. Получаем выбранные материалы
        const frameMaterial = this.getVal('#wicket-frame-material');
        const postsMaterial = this.getVal('#wicket-posts');
        const claddingMaterial = this.getVal('#wicket-cladding');
        const paintMaterial = this.getVal('#wicket-paint');
        const inFrame = document.getElementById('wicked-in-frame');


        // 4. Считаем количества (Формулы теперь работают с метрами!)
        if (frameMaterial) {
            // Периметр (в метрах) + внутренняя перемычка
            const frameLength = (width * 2 + height * 2) + width; 
            materials.push({ name: frameMaterial, quantity: parseFloat(frameLength.toFixed(2)) });
        }

        if (postsMaterial) {
            let postsLength
            if(inFrame.checked) {
                 // рама калитки + 10см на саму раму
                postsLength = ((width +0,1) *2) + ((height+0,1)*2);
                materials.push({ name: postsMaterial, quantity: parseFloat(postsLength.toFixed(2)) });
            } else {
                // 2 столба по высоте + 1.2 м на заглубление
                postsLength = (height + 1.2) * 2; 
                materials.push({ name: postsMaterial, quantity: parseFloat(postsLength.toFixed(2)) });
            }  
        }

        if (claddingMaterial) {
            // Количество материала обшивки
            const materialWidth = this.getMaterialWidth(claddingMaterial);
            const claddingCount = width / materialWidth ; 
            // Количество  материала  округляем в  большую  сторону
            materials.push({ name: claddingMaterial, quantity: Math.ceil(claddingCount)});
        }

        if (paintMaterial) {
            materials.push({ name: paintMaterial, quantity: 1 });
        }

        // Фильтруем материалы, у которых есть цена в прайсе
        return materials.filter(m => this.priceManager.getPrice(m.name));
    }
}

/**
 * Калькулятор ворот
 */
class GateCalculator extends BaseCalculator {
    constructor(rootElement, priceManager) {
        super(rootElement, priceManager);
    }

    calculateRawMaterials() {
        const materials = [];

        // 1. Получаем размеры в миллиметрах из выпадающего списка
        const widthMm = parseFloat(this.getVal('#gate-width')) || 0;
        const heightMm = parseFloat(this.getVal('#gate-height')) || 0;

        // ВАЖНО: Проверяем, выбрал ли пользователь размеры (защита от пустого placeholder)
        if (widthMm === 0 || heightMm === 0) {
            this.showNotification("Пожалуйста, выберите ширину и высоту ворот!");
        }

        // 2. Конвертируем в метры для инженерных расчетов
        const width = widthMm / 1000;
        const height = heightMm / 1000;

        const postsMaterial = this.getVal('#gate-posts');
        const frameMaterial = this.getVal('#gate-frame-material');
        const claddingMaterial = this.getVal('#gate-cladding') || this.getVal('#gate-cadding'); 
        const paintMaterial = this.getVal('#gate-paint');
        const rollers = this.getVal('#gate-rollers');
        const rack = this.getVal('#gate-rack');
        const drive = this.getVal('#gate-drive');
        const slidingGate = document.getElementById('sliding-gate');

        // --- СПЕЦИФИКА ВОРОТ ---
        if (frameMaterial) {
            let frameLength
            if(slidingGate.checked) {
                // Периметр (в метрах) + вертикальная поперечина + хвостовая часть ворот для противовеса (50% от проема)
                // + 3 диагонали + усилители хвостовой части (2  шт равны  как  раз высоте ворот)
                const diagonal = Math.sqrt(height * height + (width / 2) * (width / 2)); 
                frameLength =(width * 2 + height * 2) + height + (width/2) +(diagonal* 3) + height
                materials.push({ name: frameMaterial, quantity: frameLength });
            } else {
                // Периметр (в метрах) + внутренняя перемычка
                frameLength = (width * 2 + height * 2) + width;
                materials.push({ name: frameMaterial, quantity: frameLength });
            }       
        }

        if (postsMaterial) {
            let postLength
            if(slidingGate.checked){
                // 2 двойных столба выше высоты на 20см с перемычкой 20 см (не заглубляются)
                postLength = (height + 0,2) * 4 + 0,4; 
                materials.push({ name: postsMaterial, quantity: postLength });
            } else {
                // 2 столба по высоте + 1.5 м на заглубление
                postLength = (height + 1.5) * 2; 
                materials.push({ name: postsMaterial, quantity: postLength });
            }   
        }

        if (claddingMaterial) {
            const materialWidth = this.getMaterialWidth(claddingMaterial);
            const claddingCount = width / materialWidth ; 
            // Количество  материала  округляем в  большую  сторону
            materials.push({ name: claddingMaterial, quantity: Math.ceil(claddingCount)});
        }
        
        if (paintMaterial) {
            materials.push({ name: paintMaterial, quantity: 1});
        }

        // Ролики, зуб. рейка, привод обычно идут в штуках
        if (rollers) {
            materials.push({ name: rollers, quantity: 2 }); // 2 роликовые тележки
        }
        
        if (rack) {
            const rackLength = width + 1; // Длина ворот +  метр запаса
            materials.push({ name: rack, quantity: rackLength });
        }
        
        if (drive) {
            materials.push({ name: drive, quantity: 1 }); // 1 привод
        }

        return materials.filter(m => this.priceManager.getPrice(m.name));
    }
}

export { WicketCalculator, GateCalculator };
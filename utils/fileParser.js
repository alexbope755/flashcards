// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM
import * as mammoth from 'mammoth';

// Función para cargar PDF.js dinámicamente
const loadPDFJS = () => {
  return new Promise((resolve, reject) => {
    // Si ya está cargado, retornarlo
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    // Crear script para cargar PDF.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    
    script.onload = () => {
      // Verificar que se cargó correctamente
      if (window.pdfjsLib) {
        // Configurar el worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('PDF.js cargado exitosamente');
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js no se cargó correctamente'));
      }
    };
    
    script.onerror = (error) => {
      console.error('Error cargando PDF.js:', error);
      reject(new Error('Error cargando PDF.js desde CDN'));
    };
    
    // Agregar el script al documento
    document.head.appendChild(script);
  });
};

export const parseFile = async (file) => {
  if (!file || !(file instanceof File) || !file.type) {
    throw new Error('El parámetro debe ser un archivo válido');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;

        if (file.type === 'application/pdf') {
          try {
            const text = await parsePDF(arrayBuffer);
            resolve(text);
          } catch (error) {
            console.error('Error procesando PDF:', error);
            reject(new Error(`Error al procesar PDF: ${error.message}`));
          }
        } else if (file.type === 'text/plain') {
          const text = new TextDecoder().decode(arrayBuffer);
          resolve(text);
        } else if (
          file.type.includes('word') ||
          file.name.endsWith('.docx') ||
          file.type.includes('officedocument.wordprocessingml') ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          try {
            const text = await parseWordDocument(arrayBuffer);
            resolve(text);
          } catch (error) {
            console.error('Error procesando Word:', error);
            reject(new Error(`Error al procesar documento Word: ${error.message}`));
          }
        } else {
          reject(new Error(`Tipo de archivo no soportado: ${file.type}`));
        }
      } catch (error) {
        console.error('Error general procesando archivo:', error);
        reject(new Error(`Error al procesar archivo: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
};

const parsePDF = async (arrayBuffer) => {
  try {
    console.log('Iniciando carga de PDF.js...');
    
    // Cargar PDF.js
    const pdfjs = await loadPDFJS();
    
    console.log('PDF.js cargado, procesando documento...');
    
    // Configurar el documento PDF con opciones optimizadas
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      verbosity: 0, // Sin logs verbosos
      maxImageSize: 1024 * 1024, // 1MB máximo por imagen
      disableFontFace: true, // Optimización
      disableRange: true, // Optimización
      disableStream: true, // Optimización
      disableAutoFetch: true, // Optimización
    });

    // Timeout para evitar cuelgues
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout procesando PDF')), 30000);
    });

    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    console.log(`PDF cargado exitosamente. Páginas: ${pdf.numPages}`);
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 100); // Limitar a 100 páginas

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`Procesando página ${pageNum}/${maxPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter(item => item && item.str && typeof item.str === 'string')
          .map(item => item.str)
          .filter(str => str.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `${pageText}\n\n`;
        }
        
        // Liberar memoria de la página
        if (page.cleanup) {
          page.cleanup();
        }
        
      } catch (pageError) {
        console.warn(`Error en página ${pageNum}:`, pageError.message);
        // Continuar con la siguiente página
      }
    }

    if (pdf.numPages > maxPages) {
      fullText += `\n[Nota: Se procesaron ${maxPages} de ${pdf.numPages} páginas]\n`;
    }

    // Liberar memoria del documento
    if (pdf.cleanup) {
      pdf.cleanup();
    }
    
    console.log('PDF procesado exitosamente');
    
    if (!fullText.trim()) {
      throw new Error('No se pudo extraer texto del PDF. Verifica que el PDF contenga texto seleccionable.');
    }
    
    return fullText.trim();
    
  } catch (error) {
    console.error('Error en parsePDF:', error);
    
    // Mensajes de error más específicos
    if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
      throw new Error('El archivo PDF está corrupto o no es válido');
    } else if (error.message.includes('Timeout')) {
      throw new Error('El PDF es muy grande. Intenta con un archivo más pequeño.');
    } else if (error.message.includes('PDF.js')) {
      throw new Error('Error cargando PDF.js. Verifica tu conexión a internet.');
    } else if (error.message.includes('texto seleccionable')) {
      throw new Error('El PDF parece ser una imagen escaneada. Usa un PDF con texto seleccionable.');
    } else {
      throw new Error(`Error procesando PDF: ${error.message}`);
    }
  }
};

const parseWordDocument = async (arrayBuffer) => {
  try {
    console.log('Procesando documento Word...');
    const result = await mammoth.extractRawText({ arrayBuffer });
    console.log('Documento Word procesado exitosamente');
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No se pudo extraer texto del documento Word');
    }
    
    return result.value;
  } catch (error) {
    console.error('Error procesando Word:', error);
    throw new Error(`Error al extraer texto del documento Word: ${error.message}`);
  }
};

export const getSupportedFileTypes = () => ({
  pdf: ['application/pdf'],
  word: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word',
    'application/msword'
  ],
  text: ['text/plain']
});

export const isFileSupported = (file) => {
  if (!file || !file.type) return false;

  const supportedTypes = getSupportedFileTypes();
  const allSupported = [
    ...supportedTypes.pdf,
    ...supportedTypes.word,
    ...supportedTypes.text
  ];

  return allSupported.includes(file.type) ||
         file.name.endsWith('.docx') ||
         file.name.endsWith('.doc') ||
         file.name.endsWith('.pdf') ||
         file.name.endsWith('.txt');
};

export default parseFile;
// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM
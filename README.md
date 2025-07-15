# SmartFlip
Simple React Webapp to create flashcards, quizz and Tests with AI

// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM

Hola, espero disfrutes de mi primer repositorio público.

---

```markdown
# 🧠 SmartFlip - Generador de Flashcards y Pruebas con IA

SmartFlip es una web app educativa que transforma cualquier contenido textual en material de estudio interactivo, incluyendo:

- Flashcards inteligentes
- Preguntas de opción múltiple
- Pruebas prácticas mixtas (multiple choice, verdadero/falso, completar y emparejar)

Todo esto potenciado por la API de **DeepSeek**, ideal para estudiantes de cualquier carrera que quieran estudiar mejor, más rápido y sin complicaciones.

## 🚀 Características

- 📄 Soporte para entrada de contenido mediante:
  - Texto escrito
  - Texto pegado
  - Archivos (.pdf, .txt, .docx)
- 🔁 Navegación intuitiva por tarjetas, preguntas y pruebas
- 📊 Corrección automática de respuestas con retroalimentación inmediata
- 💾 Sin backend adicional: solo necesitas una clave API de DeepSeek
- 🎨 Interfaz animada, accesible y adaptable

## 🧩 Tecnologías usadas

- **React 18**
- **TailwindCSS**
- **DeepSeek API**
- **Lucide Icons**
- **Vite** (opcional para build)

## 📦 Estructura mínima del proyecto

```

📁 src/
│
├── App.jsx               # Componente principal con toda la lógica de UI y flujo
├── services/
│   └── deepseekApi.js    # Funciones para generar flashcards, quizzes y tests usando DeepSeek
├── utils/
│   └── fileParser.js     # (No incluido, pero se espera para parsear archivos .pdf, .docx, etc.)

````

## ⚙️ Instalación y ejecución

1. **Clona el repositorio**  
   ```bash
   git clone https://github.com/alexbope755/smartflip.git
   cd smartflip
````

2. **Instala las dependencias**

   ```bash
   npm install
   ```

3. **Agrega tu clave de API de DeepSeek**
   En `deepseekApi.js`, reemplaza la constante `DEEPSEEK_API_KEY` con tu clave personal de API.

4. **Inicia la aplicación**

   ```bash
   npm run dev
   ```

## 📘 Ejemplos de uso

1. Describe un tema como: `"Sistema Nervioso Central"` y genera flashcards.
2. Sube un archivo `.pdf` con tus apuntes y crea una prueba práctica.
3. Pega texto de Wikipedia y responde preguntas tipo test.

## ✨ Créditos

Creado por **BOPE Corp.**, 2025
Con ❤️ para estudiantes que buscan estudiar de forma más inteligente, no más dura.

---

> *Este proyecto no está afiliado oficialmente con DeepSeek. Uso bajo responsabilidad del desarrollador.*

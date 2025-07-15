// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_HERE';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const generateFlashcards = async (content, type = 'describe') => {
  let prompt;
  
  if (type === 'paste' || type === 'file') {
    prompt = `Eres un asistente educativo especializado en crear tarjetas de estudio. Tu tarea es extraer el contenido más importante del siguiente texto y crear tarjetas de estudio efectivas.

Texto a analizar:
${content}

Instrucciones para crear las tarjetas:
1. Identifica los términos, conceptos o frases más importantes del texto
2. Para cada término, crea una definición clara y concisa basada en el texto
3. Las tarjetas deben ser educativas y fáciles de entender
4. Crea entre 5-50 tarjetas dependiendo del contenido disponible
5. El frente debe ser conciso (1-10 palabras idealmente)
6. El reverso debe ser claro y educativo (máximo 50 palabras)

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "front": "Término o concepto",
    "back": "Definición o explicación clara"
  }
]

NO incluyas texto fuera del array JSON.`;
  } else {
    prompt = `Eres un asistente educativo especializado en crear tarjetas de estudio. Tu tarea es crear tarjetas educativas sobre el tema: "${content}"

Instrucciones para crear las tarjetas:
1. Crea las tarjetas que consideres necesarias sobre el tema de estudio, mínimo 5 y máximo 50 tarjetas
2. Cada tarjeta debe tener un término/concepto claro en el frente
3. La definición del reverso debe ser educativa y precisa
4. Adapta el enfoque según el tipo de tema:
   - Ubicaciones: Usa el lugar como término y datos clave como definición
   - Historia: Usa eventos/personas como términos y fechas/importancia como definiciones
   - Ciencia: Usa conceptos como términos y explicaciones como definiciones
   - Idiomas: Usa palabras en un idioma como términos y traducciones como definiciones
5. El frente debe ser conciso (1-5 palabras idealmente)
6. El reverso debe ser claro y educativo (máximo 50 palabras)
7. Asegúrate de que las tarjetas sean visualmente atractivas y fáciles de estudiar.
8. Evalúa qué preguntas o conceptos son más relevantes para el tema y exámenes.

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "front": "Término o concepto",
    "back": "Definición o explicación clara"
  }
]

NO incluyas texto fuera del array JSON.`;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const flashcards = JSON.parse(content);
      return flashcards;
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No se pudo parsear la respuesta como JSON');
    }
  } catch (error) {
    console.error('Error al generar flashcards:', error);
    throw error;
  }
};

export const generateQuiz = async (content, type = 'describe') => {
  let prompt;
  
  if (type === 'paste' || type === 'file') {
    prompt = `Eres un asistente educativo especializado en crear preguntas de opción múltiple. Tu tarea es extraer el contenido más importante del siguiente texto y crear preguntas de opción múltiple con 4 opciones.

Texto a analizar:
${content}

Instrucciones para crear las preguntas:
1. Identifica los conceptos, hechos o términos clave del texto.
2. Crea entre 5-50 preguntas dependiendo del contenido disponible.
3. Cada pregunta debe tener:
   - Un enunciado claro y conciso (máximo 100 palabras).
   - Exactamente 4 opciones de respuesta, donde solo una es correcta.
   - Un índice (0-3) que indique la opción correcta.
   - Una explicación breve (máximo 50 palabras) de por qué la opción correcta es correcta y/o por qué las otras son incorrectas.
4. Las preguntas deben ser educativas, relevantes y útiles para estudiar.
5. Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas.

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "question": "Enunciado de la pregunta",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswer": 0,
    "explanation": "Explicación de la respuesta correcta"
  }
]

NO incluyas texto fuera del array JSON.`;
  } else {
    prompt = `Eres un asistente educativo especializado en crear preguntas de opción múltiple. Tu tarea es crear preguntas educativas sobre el tema: "${content}"

Instrucciones para crear las preguntas:
1. Crea entre 5-50 preguntas sobre el tema, según su complejidad.
2. Cada pregunta debe tener:
   - Un enunciado claro y conciso (máximo 100 palabras).
   - Exactamente 4 opciones de respuesta, donde solo una es correcta.
   - Un índice (0-3) que indique la opción correcta.
   - Una explicación breve (máximo 50 palabras) de por qué la opción correcta es correcta y/o por qué las otras son incorrectas.
3. Adapta el enfoque según el tipo de tema:
   - Ubicaciones: Pregunta sobre datos clave del lugar.
   - Historia: Pregunta sobre eventos, fechas o personajes importantes.
   - Ciencia: Pregunta sobre conceptos, procesos o aplicaciones.
   - Idiomas: Pregunta sobre vocabulario, gramática o traducciones.
4. Las preguntas deben ser educativas, relevantes y útiles para estudiar.
5. Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas.

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "question": "Enunciado de la pregunta",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswer": 0,
    "explanation": "Explicación de la respuesta correcta"
  }
]

NO incluyas texto fuera del array JSON.`;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Error de API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const quizQuestions = JSON.parse(content);
      return quizQuestions;
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No se pudo parsear la respuesta como JSON');
    }
  } catch (error) {
    console.error('Error al generar quiz:', error);
    throw error;
  }
};

export const generatePracticeTest = async (content, type = 'describe') => {
  let prompt;
  
  if (type === 'paste' || type === 'file') {
    prompt = `Eres un asistente educativo especializado en crear pruebas prácticas. Tu tarea es extraer el contenido más importante del siguiente texto y crear una prueba con una mezcla de preguntas de opción múltiple, verdadero/falso, completar espacios y emparejamiento.

Texto a analizar:
${content}

Instrucciones para crear la prueba:
1. Crea entre 5-50 preguntas, con al menos una de cada tipo (opción múltiple, verdadero/falso, completar espacios, emparejamiento).
2. Cada pregunta debe tener:
   - Un enunciado claro y conciso (máximo 100 palabras).
   - Un tipo ("multiple", "truefalse", "fill", "match").
   - Para "multiple": 4 opciones, un índice (0-3) de la respuesta correcta.
   - Para "truefalse": Respuesta correcta como booleano (true/false).
   - Para "fill": Respuesta correcta como texto (máximo 50 palabras).
   - Para "match": Lista de opciones y respuestas correctas como arrays de igual longitud.
   - Una explicación breve (máximo 50 palabras) de la respuesta correcta.
3. Las preguntas deben ser educativas, relevantes y útiles para estudiar.
4. Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas.

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "type": "multiple",
    "question": "Enunciado de la pregunta",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswer": 0,
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "truefalse",
    "question": "Enunciado de la pregunta",
    "correctAnswer": true,
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "fill",
    "question": "Enunciado de la pregunta",
    "correctAnswer": "Respuesta correcta",
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "match",
    "question": "Enunciado de la pregunta",
    "options": ["Término 1", "Término 2", "Término 3"],
    "matches": ["Definición 1", "Definición 2", "Definición 3"],
    "correctAnswer": ["Definición 1", "Definición 2", "Definición 3"],
    "explanation": "Explicación de la respuesta correcta"
  }
]

NO incluyas texto fuera del array JSON.`;
  } else {
    prompt = `Eres un asistente educativo especializado en crear pruebas prácticas. Tu tarea es crear una prueba educativa sobre el tema: "${content}"

Instrucciones para crear la prueba:
1. Crea entre 15-50 preguntas, con al menos una de cada tipo (opción múltiple, verdadero/falso, completar espacios, emparejamiento).
2. Cada pregunta debe tener:
   - Un enunciado claro y conciso (máximo 100 palabras).
   - Un tipo ("multiple", "truefalse", "fill", "match").
   - Para "multiple": 4 opciones, un índice (0-3) de la respuesta correcta.
   - Para "truefalse": Respuesta correcta como booleano (true/false).
   - Para "fill": Respuesta correcta como texto (máximo 50 palabras).
   - Para "match": Lista de opciones y respuestas correctas como arrays de igual longitud.
   - Una explicación breve (máximo 50 palabras) de la respuesta correcta.
3. Adapta el enfoque según el tipo de tema:
   - Ubicaciones: Pregunta sobre datos clave del lugar.
   - Historia: Pregunta sobre eventos, fechas o personajes importantes.
   - Ciencia: Pregunta sobre conceptos, procesos o aplicaciones.
   - Idiomas: Pregunta sobre vocabulario, gramática o traducciones.
4. Las preguntas deben ser educativas, relevantes y útiles para estudiar.
5. Asegúrate de que las opciones incorrectas sean plausibles pero claramente incorrectas.

Responde ÚNICAMENTE con un array JSON válido en este formato exacto:
[
  {
    "type": "multiple",
    "question": "Enunciado de la pregunta",
    "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
    "correctAnswer": 0,
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "truefalse",
    "question": "Enunciado de la pregunta",
    "correctAnswer": true,
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "fill",
    "question": "Enunciado de la pregunta",
    "correctAnswer": "Respuesta correcta",
    "explanation": "Explicación de la respuesta correcta"
  },
  {
    "type": "match",
    "question": "Enunciado de la pregunta",
    "options": ["Término 1", "Término 2", "Término 3"],
    "matches": ["Definición 1", "Definición 2", "Definición 3"],
    "correctAnswer": ["Definición 1", "Definición 2", "Definición 3"],
    "explanation": "Explicación de la respuesta correcta"
  }
]

NO incluyas texto fuera del array JSON.`;
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const testQuestions = JSON.parse(content);
      return testQuestions;
    } catch (parseError) {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('The response could not be parsed as JSON');
    }
  } catch (error) {
    console.error('Error generating practice test:', error);
    throw error;
  }
};
// WEBAPP CREATED BY ALEXANDER BONE, HTTPS://WWW.ALEXBOPE75.COM
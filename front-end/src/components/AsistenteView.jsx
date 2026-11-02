import React, { useState, useRef, useEffect } from 'react';

export default function AsistenteView() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `¡Hola, instructor! Soy tu asistente pedagógico para consultar el <strong>Reglamento del Aprendiz SENA (Acuerdo 007 de 2012)</strong>. Puedes hacerme preguntas como:
      <ul>
        <li><em>"¿Cuáles son las causales de llamado de atención por inasistencia?"</em></li>
        <li><em>"¿Qué procedimiento sigue un comité de evaluación y seguimiento?"</em></li>
        <li><em>"¿Cuáles son los deberes y prohibiciones en etapa lectiva?"</em></li>
      </ul>`
    }
  ]);
  const [input, setInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');

    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      setMessages([...newMessages, { role: 'bot', content: botResponse }]);
    }, 400);
  };

  const generateBotResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes('asistencia') || q.includes('inasistencia') || q.includes('falta')) {
      return `De acuerdo con el <strong>Artículo 22 del Reglamento del Aprendiz SENA</strong>:<br/>
      • Las inasistencias deben ser justificadas ante el instructor dentro de los <strong>tres (3) días hábiles siguientes</strong> a su ocurrencia.<br/>
      • Son causales justificadas: incapacidad médica certificada por EPS/Sisalud, calamidad doméstica demostrada, fuerza mayor o comisiones oficiales.<br/>
      • Si el aprendiz acumula inasistencias injustificadas superiores a 3 días consecutivos o no consecutivos equivalentes a un porcentaje representativo de la competencia, se inicia el debido proceso para <strong>deserción</strong> (Art. 22 numeral 4).`;
    }

    if (q.includes('comite') || q.includes('comité') || q.includes('evaluacion') || q.includes('seguimiento')) {
      return `Conforme al <strong>Artículo 29 del Reglamento</strong>:<br/>
      El <strong>Comité de Evaluación y Seguimiento</strong> es la instancia asesora del Subdirector de Centro para analizar el rendimiento académico y disciplinario de los aprendices.<br/>
      • El aprendiz tiene derecho a ser escuchado en descargos y aportar evidencias.<br/>
      • El comité recomienda medidas formativas (Planes de mejoramiento, llamado de atención escrito) o sancionatorias (condicionamiento o cancelación de matrícula).`;
    }

    if (q.includes('derechos') || q.includes('derecho')) {
      return `Según el <strong>Artículo 7 del Reglamento del Aprendiz</strong>, son derechos fundamentales:<br/>
      1. Recibir formación profesional integral de calidad conforme al programa curricular.<br/>
      2. Hacer uso de los ambientes de aprendizaje, recursos bibliográficos y herramientas TIC.<br/>
      3. Ser evaluado con criterios objetivos y conocer oportunamente los juicios evaluativos (Aprobado/Por evaluar).<br/>
      4. Solicitar revisión de evaluaciones dentro de los términos establecidos.`;
    }

    return `Basado en el <strong>Reglamento del Aprendiz SENA</strong>:<br/>
    Su consulta ha sido procesada. Todo procedimiento formativo garantiza el debido proceso, el derecho a la defensa y la trazabilidad de los juicios evaluativos en SOFIA Plus / Zajuna.<br/>
    <em>¿Deseas consultar sobre faltas disciplinarias, planes de mejoramiento o trámites de aplazamiento y traslado?</em>`;
  };

  return (
    <section className="view-section active">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <i className="ph ph-robot chat-avatar"></i>
            <div>
              <h3>Asistente IA — Reglamento del Aprendiz SENA</h3>
              <span>Consultas semánticas y citas directas de acuerdos y deberes</span>
            </div>
          </div>
          <span className="badge blue">Acuerdo Vigente SENA</span>
        </div>
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <div key={idx} className={`message ${m.role}`}>
              {m.role === 'bot' && <i className="ph ph-robot message-icon"></i>}
              <div 
                className="message-bubble" 
                dangerouslySetInnerHTML={{ __html: m.content }} 
              />
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        <div className="chat-input-area">
          <input 
            type="text" 
            placeholder="Escribe tu consulta sobre el reglamento del aprendiz..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="btn btn-primary" onClick={handleSend}>
            <i className="ph ph-paper-plane-right"></i>
          </button>
        </div>
      </div>
    </section>
  );
}


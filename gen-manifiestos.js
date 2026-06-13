/**
 * Genera los manifiestos oficiales del Cuarto Impacto en Word.
 * Estilo editorial: Cormorant (serif) + DM Sans (sans), navy + dorado.
 */
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  PageOrientation, LevelFormat, HeadingLevel, BorderStyle,
  PageBreak, Footer, Header, PageNumber, TabStopType, TabStopPosition,
} = require('docx');

const NAVY  = '0F2137';
const NAVY_MID = '1E3A5F';
const GOLD  = 'C8920A';
const GOLDB = 'F4B822';
const INK   = '141210';
const MUTED = '6B7280';
const PAPER = 'FAF8F3';

// =======================================================================
// CONTENIDO ES
// =======================================================================
const ES = {
  brand: 'EL CUARTO IMPACTO',
  title1: 'Cuarto',
  title2: 'Impacto',
  subtitle: 'Una declaración sobre la responsabilidad digital como nueva dimensión del valor empresarial',
  dimensions: ['Económico', 'Social', 'Ambiental', '+ Digital ★'],
  authorLine: 'PAULA MONTE',
  authorRole: 'Empresaria · Speaker · Creadora del Cuarto Impacto',
  versionLine: 'Manifiesto 4to Impacto · VF26',
  foundationTitle: 'FUNDAMENTO',
  foundationParas: [
    'Durante décadas, la teoría y la práctica empresarial aprendieron a reconocer que el valor de una organización no puede reducirse a sus resultados financieros. El paradigma del triple impacto —económico, social y ambiental— representó un avance conceptual y ético de primera magnitud.',
    'Ese modelo sigue vigente. Pero el mundo que lo alberga ha cambiado de manera sustantiva. Las organizaciones debemos adaptarnos a este nuevo escenario.',
    'La irrupción de la inteligencia artificial, la automatización de procesos cognitivos y la digitalización masiva de las operaciones representan, aparte de una tendencia tecnológica más, un cambio radical en la naturaleza misma del trabajo, la toma de decisiones y la organización humana. Las empresas hoy operan tanto en territorios físicos como en sistemas simbólicos, flujos de datos y entornos algorítmicos que moldean comportamientos y construyen —o destruyen— tejido humano.',
    'Ante esta realidad, el triple impacto resulta necesario pero insuficiente. Le falta una dimensión que debe prestarse atención para evitar el costo ético, estratégico y cultural.',
    'La tecnología y la inteligencia artificial son instrumentos poderosos, aceleradores, transformadores basados en las decisiones humanas que las diseñan, las implementan y las dirigen.',
  ],
  foundationLead: 'El Cuarto Impacto es la responsabilidad de las empresas por la manera en que integran, usan y distribuyen el poder de la tecnología y la inteligencia artificial. No es una cuestión técnica. Es una cuestión de criterio, de valores y de proyecto colectivo.',
  foundationClose: 'Este manifiesto establece los catorce principios que orientan una forma de pensar y construir empresas para una era que exige, simultáneamente, más eficiencia y más humanidad.',
  principlesTitle: 'LOS CATORCE PRINCIPIOS',
  principlesSub: 'Una ética para la era de la inteligencia artificial',
  principles: [
    {
      n: 'I', title: 'La tecnología es la herramienta, y las personas son el motor.',
      body: [
        'Existe una confusión en el discurso de la transformación digital: la tendencia a tratar la incorporación tecnológica como si fuera, en sí misma, el objetivo de la transformación. Esa mirada invierte el orden correcto de las cosas.',
        'Ninguna transformación profunda empieza en un software ni en una plataforma. Empieza en las personas: en su disposición a aprender, su capacidad de adaptarse a los cambios, de cuestionar procesos establecidos y su voluntad de integrar lo nuevo sin perder lo esencial.',
      ],
      pull: 'La tecnología puede acelerar procesos. Pero las personas son quienes le otorgan dirección, sentido, criterio humano y límites.',
    },
    {
      n: 'II', title: 'La responsabilidad digital es la nueva ética empresarial.',
      body: [
        'Así como el paradigma del triple impacto extendió la responsabilidad empresarial hacia las dimensiones económica, social y ambiental, el Cuarto Impacto extiende esa responsabilidad hacia el dominio digital. Es una obligación que emerge de la naturaleza misma del poder que la tecnología confiere.',
        'La responsabilidad digital implica transparencia sobre el uso de datos, criterio ético en el diseño de automatizaciones, conciencia sobre los sesgos algorítmicos y protección genuina de la privacidad.',
      ],
      pull: 'No todo lo que puede automatizarse debe automatizarse. Y aquello que se automatice debe hacerse con un criterio amplio de ética y responsabilidad.',
    },
    {
      n: 'III', title: 'La inteligencia artificial debe ampliar la inteligencia humana, no sustituirla.',
      body: [
        'La inteligencia artificial es extraordinariamente capaz en tareas de reconocimiento de patrones y procesamiento de la información. Pero carece del juicio situado, la sensibilidad ética, la capacidad de formular las preguntas correctas antes de responderlas. Trabaja sobre la base de lo ya existente, de lo ya creado por inteligencia humana.',
        'Su valor más alto reside en liberar capacidades humanas: tiempo de tareas repetitivas, energía de procesos ineficientes, acceso a grandes volúmenes de información con velocidad. Todo ello para que el pensamiento humano pueda ocuparse de lo irreemplazable.',
      ],
      pull: 'La IA no viene a pensar por nosotros. Viene a exigirnos pensar mejor, con más profundidad y sobre preguntas más relevantes.',
    },
    {
      n: 'IV', title: 'Automatizar sin estrategia es institucionalizar el desorden.',
      body: [
        'Hay una trampa bien documentada en los procesos de transformación digital acelerada: la tendencia a automatizar procesos existentes sin cuestionarlos previamente. Un proceso ineficiente, cuando se automatiza, produce ineficiencia a mayor velocidad y con menor visibilidad.',
        'El Cuarto Impacto sostiene que la transformación tecnológica exige, como condición previa, un trabajo de comprensión organizacional: mapear procesos reales, sistematizar, estandarizar con criterio e identificar dónde reside el valor y dónde el desperdicio.',
      ],
      pull: 'Primero comprensión. Después diseño. Primero criterio. Después herramienta.',
    },
    {
      n: 'V', title: 'La adaptabilidad es la competencia estratégica del siglo.',
      body: [
        'Los sistemas que sobreviven en entornos turbulentos no son los más grandes ni los más poderosos, sino los más capaces de aprender y reconfigurarse. La velocidad del cambio tecnológico ha convertido esta observación en una exigencia operativa de primer orden.',
        'Adaptarse en contextos empresariales significa desarrollar la capacidad institucional de leer señales débiles, revisar supuestos e incorporar información contradictoria sin paralizarse. Implica abandonar la idea de construir cosas "para siempre" y desarrollar desde el primer día una mentalidad flexible: todo lo que se diseña debe estar preparado para cambiar.',
      ],
      pull: 'En la era digital, resistirse al cambio también es una decisión. Solo que suele ser la más costosa.',
    },
    {
      n: 'VI', title: 'La eficiencia debe estar al servicio del bienestar, no a su costa.',
      body: [
        'Uno de los riesgos menos debatidos de la automatización masiva es su potencial para intensificar las condiciones de trabajo bajo la apariencia de optimización. Cuando la tecnología elimina fricciones, puede también eliminar los márgenes de recuperación que hacen sostenible el trabajo humano.',
        'Una empresa verdaderamente inteligente usa la tecnología para liberarse de las tareas operativas y repetitivas, en pos del desarrollo de la creatividad y el agregado de valor a través de funciones más humanas. El bienestar es la condición biológica y ecológica que hace posible que una empresa siga siendo competitiva, adaptable e innovadora a largo plazo. Cuidar el margen de recuperación humana es estratégico.',
      ],
      pull: 'La productividad sin humanidad no es eficiencia. Es desgaste diferido.',
    },
    {
      n: 'VII', title: 'Las capacidades humanas son la tecnología más importante de cualquier organización.',
      body: [
        'Cuanto más poderosas son las capacidades de los sistemas, más valiosas se vuelven aquellas habilidades que los sistemas no pueden replicar: pensamiento crítico, creatividad, empatía, liderazgo, comunicación asertiva y juicio ético ante situaciones ambiguas.',
        'Cuando la inteligencia artificial absorbe gran parte del "hacer" —las tareas repetitivas, el procesamiento de datos, la generación de respuestas estándar—, las personas atraviesan una transición de identidad que las organizaciones no pueden ignorar. El Cuarto Impacto declara que "humanidad potenciada" implica también aprender a valorar a las personas por habitar la ambigüedad, facilitar conversaciones con sentido, tomar decisiones con criterio humano.',
      ],
      pull: 'El futuro no será de quienes solo sepan usar herramientas. Será de quienes sepan pensar, decidir, comunicar y liderar mejor con ellas.',
    },
    {
      n: 'VIII', title: 'El pensamiento profundo requiere protección.',
      body: [
        'La lógica de la inmediatez digital cambia estructuralmente los modos de pensar: desplaza la atención sostenida en favor de la reacción rápida, y convierte la superficialidad en el único registro posible del pensamiento.',
        'Las organizaciones tienen la responsabilidad de proteger espacios de pausa, conversación y reflexión. Porque ahí se procesa el sistema, decanta el aprendizaje y previene la alienación. El diálogo saludable con la tecnología requiere, como condición previa, la capacidad de sostener un diálogo genuino con uno mismo y con el otro.',
      ],
      pull: 'Usar bien la inteligencia artificial no es pedirle que piense por nosotros. Es aprender a dialogar con ella sin renunciar a nuestra propia voz.',
    },
    {
      n: 'IX', title: 'Liderar la transformación tecnológica es, ante todo, una responsabilidad humana.',
      body: [
        'La transformación digital no es simplemente implementar un sistema. Ocurre cuando las personas de una organización cambian su manera de pensar con tecnología, de trabajar, de decidir y de relacionarse. Y ese cambio no se decreta: se acompaña, se explica, se cuida.',
        'Los líderes que navegan bien la era de la IA son los que comunican con claridad el para qué antes del cómo, escuchan las resistencias sin descartarlas y entienden que la confianza organizacional no la construye solo el líder hacia su equipo: es una red de contención mutua que se teje entre todos los niveles de la organización, especialmente en épocas de incertidumbre y cambio acelerado. La transformación digital es, en su raíz, un proyecto colectivo.',
      ],
      pull: 'La adopción tecnológica saludable requiere confianza. Y la confianza no se instala con tecnología. Se construye con liderazgo y se sostiene con reciprocidad.',
    },
    {
      n: 'X', title: 'La tecnología debe ampliar oportunidades, no profundizar desigualdades.',
      body: [
        'El desarrollo tecnológico tiene una tendencia estructural que debe ser contrarrestada: la de concentrar sus beneficios en quienes ya poseen capital, acceso y conocimiento, y sus costos en quienes carecen de ellos.',
        'Formar equipos de manera inclusiva, diseñar herramientas accesibles y reducir brechas son acciones de coherencia con un proyecto empresarial que se proclama responsable.',
      ],
      pull: 'La inclusión digital no es acceso a herramientas. Es acceso a comprensión, participación y oportunidad.',
    },
    {
      n: 'XI', title: 'La transformación tecnológica bien liderada fortalece la identidad organizacional.',
      body: [
        'Existe un miedo legítimo ante la transformación digital: a que la incorporación de tecnología erosione la cultura o el estilo de servicio que constituye la identidad de la empresa.',
        'Cuando la transformación está bien liderada ocurre exactamente lo contrario: la tecnología libera a las personas de las tareas que no las definen, para que puedan dedicarse con mayor intensidad a las que sí lo hacen.',
      ],
      pull: 'Adoptar tecnología no es perder identidad. Es potenciar lo mejor de una organización con nuevas capacidades.',
    },
    {
      n: 'XII', title: 'El futuro no es IA o humanos. Es humanidad potenciada por tecnología.',
      body: [
        'La tecnología y la inteligencia artificial son instrumentos: poderosos, aceleradores, transformadores basados en las decisiones humanas que las diseñan, las implementan y las dirigen.',
        'La pregunta más importante no es si la inteligencia artificial reemplazará a las personas. Es qué tipo de personas, líderes y organizaciones queremos ser en una era en que nuestras capacidades pueden ser ampliadas por tecnología. El Cuarto Impacto propone empresas donde la IA ayude pero no gobierne; donde los datos orienten pero no deshumanicen; donde la eficiencia importe pero no más que el bienestar; y donde las personas sean valoradas no solo por lo que producen, sino por quiénes son y la calidad humana con la que habitan sus roles.',
      ],
      pull: 'El futuro no será simplemente digital. Será humano o no será verdaderamente futuro.',
    },
    {
      n: 'XIII', title: 'La confidencialidad de los datos es un derecho humano, no una opción técnica.',
      body: [
        'Las empresas que operan con datos de personas asumen una responsabilidad que va más allá del cumplimiento legal. Los datos son activos que contienen historias, vulnerabilidades, decisiones y vínculos de personas reales.',
        'Una empresa comprometida con el Cuarto Impacto protege los datos con el mismo criterio con el que protegería cualquier otro derecho fundamental porque entiende el peso ético de lo que custodia.',
      ],
      pull: 'Las empresas que usan datos de personas tienen la obligación de protegerlos, explicar su uso y garantizar que nunca sean instrumento de vulneración.',
    },
    {
      n: 'XIV', title: 'La tecnología debe operar dentro de los límites del planeta, no a sus expensas.',
      body: [
        'La transformación digital tiene una dimensión ambiental que pocas organizaciones miden y menos aún gestionan: el consumo energético de los centros de datos, la obsolescencia acelerada de los dispositivos, la huella de carbono de los modelos de inteligencia artificial a gran escala. Ignorar ese impacto solo lo invisibiliza.',
        'Una empresa del Cuarto Impacto entiende que usar tecnología con responsabilidad implica también preguntarse por su costo ambiental. No se trata de renunciar a la innovación, sino de asegurarse de que el progreso digital no avance en detrimento del planeta que lo sostiene. La eficiencia tecnológica y la sostenibilidad ambiental, cuando se diseñan juntos, se potencian mutuamente.',
      ],
      pull: 'La empresa inteligente no solo mide lo que produce. Mide también lo que consume, lo que emite y lo que deja atrás.',
    },
  ],
  closingTitle: 'DECLARACIÓN FINAL',
  closingSub: 'Un llamado a construir empresas que merezcan el futuro que afirman querer.',
  closingParas: [
    'El Cuarto Impacto no es un manifiesto contra la tecnología. Es un manifiesto sobre la responsabilidad que viene con ella. Sobre la diferencia entre usar el poder que la inteligencia artificial confiere de manera consciente o de manera irreflexiva.',
    'El triple impacto nos enseñó que una empresa no puede crecer de espaldas a la sociedad, al ambiente ni a la sostenibilidad económica. El Cuarto Impacto completa esa mirada para este tiempo. Porque hoy una empresa también debe responder por la manera en que usa la tecnología, los datos, la automatización y la inteligencia artificial.',
    'La inteligencia artificial puede ser una amenaza cuando se usa sin criterio. Puede ser una moda cuando se usa sin estrategia. Pero puede ser también una aliada extraordinaria cuando se integra con responsabilidad, eficiencia y bienestar.',
  ],
  callLines: [
    'Seamos empresas de cuatro impactos.',
    'Empresas que generen valor económico.',
    'Empresas que eleven a las personas.',
    'Empresas que cuiden el planeta.',
    'Empresas que usen la tecnología con conciencia.',
  ],
  callLines2: [
    'Seamos líderes del Cuarto Impacto.',
    'No para adaptarnos al futuro de cualquier manera.',
    'Sino para diseñarlo con responsabilidad.',
  ],
  authorBlock: [
    'Paula Monte',
    'Empresaria · Speaker · Creadora del Cuarto Impacto',
    'PM Consultora Empresarial · elcuartoimpacto.com',
    'Córdoba, Argentina — Mayo 2025',
  ],
};

// =======================================================================
// CONTENIDO EN
// =======================================================================
const EN = {
  brand: 'THE FOURTH IMPACT',
  title1: 'Fourth',
  title2: 'Impact',
  subtitle: 'A declaration on digital responsibility as the new dimension of business value',
  dimensions: ['Economic', 'Social', 'Environmental', '+ Digital ★'],
  authorLine: 'PAULA MONTE',
  authorRole: 'Entrepreneur · Speaker · Creator of The Fourth Impact',
  versionLine: 'The Fourth Impact Manifesto · VF26',
  foundationTitle: 'FOUNDATION',
  foundationParas: [
    'For decades, business theory and practice learned that the value of an organization cannot be reduced to its financial results. The triple impact paradigm —economic, social, and environmental— represented a conceptual and ethical advance of the first order.',
    'That model remains valid. But the world it inhabits has substantially changed. Organizations must adapt to this new reality.',
    'The emergence of artificial intelligence, the automation of cognitive processes, and the massive digitalization of operations represent not only a technological trend but also a radical shift in the very nature of work, decision-making, and human organization. Organizations today operate both in physical territories and in symbolic systems, data flows, and algorithmic environments that shape behaviors and build —or destroy— human fabric.',
    'Faced with this reality, the triple impact is necessary but insufficient. It lacks a dimension that must be attended to in order to avoid ethical, strategic, and cultural cost.',
    'Technology and artificial intelligence are powerful instruments — accelerating, transformative — based on the human decisions that design, implement, and direct them.',
  ],
  foundationLead: 'The Fourth Impact is the responsibility of organizations for how they integrate, use, and distribute the power of technology and artificial intelligence. It is not a technical matter, but one of judgment, values, and collective purpose.',
  foundationClose: 'This manifesto establishes the fourteen principles that guide a way of thinking and building organizations for an era that simultaneously demands greater efficiency and greater humanity.',
  principlesTitle: 'THE FOURTEEN PRINCIPLES',
  principlesSub: 'An ethics for the age of artificial intelligence',
  principles: [
    {
      n: 'I', title: 'Technology is the tool, and people are the engine.',
      body: [
        'There is confusion in the discourse of digital transformation: the tendency to treat the incorporation of technology as if it were in itself the goal of transformation. That perspective inverts the correct order of things.',
        'No profound transformation begins in a software nor a platform. It begins with people: in their willingness to learn, their ability to adapt to change, to question established processes, and their commitment to integrate the new without losing what is essential.',
      ],
      pull: 'Technology can accelerate processes. But people are the ones who provide direction, meaning, human judgment, and limits.',
    },
    {
      n: 'II', title: 'Digital responsibility is the new business ethics.',
      body: [
        'Just as the triple impact paradigm extended corporate responsibility toward economic, social, and environmental dimensions, the Fourth Impact extends that responsibility to the digital domain. It is an obligation that emerges from the very nature of the power that technology confers.',
        'Digital responsibility implies transparency about data use, ethical judgment in the design of automations, awareness of algorithmic biases, and genuine protection of privacy.',
      ],
      pull: 'Not everything that can be automated should be automated. And whatever is automated must be done with broad criteria of ethics and responsibility.',
    },
    {
      n: 'III', title: 'Artificial intelligence must expand human intelligence, not replace it.',
      body: [
        'Artificial intelligence is extraordinarily capable of recognizing patterns and processing information. But it lacks situated judgment, ethical sensitivity, and the ability to ask the right questions before answering them. It works with what already exists, from what has already been created by human intelligence.',
        'Its highest value lies in liberating human capacities: time from repetitive tasks, energy from inefficient processes, access to large volumes of information at speed — all so that human thinking can focus on what is irreplaceable.',
      ],
      pull: 'The work of AI is not to think for us. It demands that we think better, with more depth, and about more relevant questions.',
    },
    {
      n: 'IV', title: 'Automating without strategy is institutionalizing disorder.',
      body: [
        'There is a well-documented trap in accelerated digital transformation processes: the tendency to automate existing processes without questioning them first. When an inefficient process is automated, it accelerates the inefficiency with less visibility.',
        'The Fourth Impact holds that technological transformation requires a previous work of organizational understanding: mapping real processes, systematizing, standardizing with judgment, and identifying the value and the waste.',
      ],
      pull: 'First understanding. Then design. First judgment. Then tool.',
    },
    {
      n: 'V', title: 'Adaptability is the strategic competency of the century.',
      body: [
        'The systems that survive turbulent environments are not the largest nor the most powerful, but those most capable of learning and reconfiguring. The speed of technological change has turned this observation into a first-order operational requirement.',
        'In business contexts, adapting means developing the institutional capacity to read weak signals, revise assumptions, and incorporate contradictory information without being paralyzed. It means abandoning the idea of building things "forever" and developing a flexible mindset from day one: every thing that is designed must be built to change.',
      ],
      pull: 'In the digital age, resisting change is also a decision. It usually is the most expensive one.',
    },
    {
      n: 'VI', title: 'Efficiency must serve wellbeing, not be at its expense.',
      body: [
        'One of the least debated risks of mass automation is its potential to intensify working conditions under the guise of optimization. When technology eliminates friction, it can also eliminate the recovery margins that make human work sustainable over time.',
        'A truly intelligent organization uses technology to free itself from operational and repetitive tasks, in pursuit of developing creativity and adding value through human functions. Wellbeing is the biological and ecological condition that allows an organization to remain competitive, adaptable, and innovative over time. Protecting human recovery margins is strategic.',
      ],
      pull: 'Productivity without humanity is not efficiency. It is deferred exhaustion.',
    },
    {
      n: 'VII', title: 'Human capabilities are the most important technology of any organization.',
      body: [
        'The more powerful the capabilities of systems, the more value is added to those skills that systems cannot replicate: critical thinking, creativity, empathy, leadership, assertive communication, and ethical judgment in ambiguous situations.',
        'When artificial intelligence absorbs much of the "doing" — repetitive tasks, data processing, standard response generation — people undergo an identity transition that organizations cannot ignore. The Fourth Impact declares that "empowered humanity" also means learning to value people for inhabiting ambiguity, facilitating meaningful conversations, and making decisions with human judgment.',
      ],
      pull: 'The future will not belong to those who know only how to use tools. It will belong to those who know how to think, decide, communicate, and lead better with them.',
    },
    {
      n: 'VIII', title: 'Deep thinking requires protection.',
      body: [
        'The logic of digital immediacy structurally changes modes of thinking: it displaces sustained attention in favor of rapid reaction, and it turns superficiality into the only possible register of thought.',
        'Organizations have the responsibility to protect spaces for pause, conversation, and reflection. Because that is where the system processes, distills learning, and prevents alienation. Healthy dialogue with technology requires the previous capacity to sustain genuine dialogue with oneself and with others.',
      ],
      pull: 'Using artificial intelligence well is not asking it to think for us. It is learning to dialogue with it without surrendering our own voice.',
    },
    {
      n: 'IX', title: 'Leading technological transformation is, above all, a human responsibility.',
      body: [
        'Digital transformation is not simply implementing a system. It occurs when people in an organization change their way of thinking with technology, working, deciding, and relating. And that change is not decreed: it is accompanied, explained, and cared for.',
        'The leaders who navigate well the AI era are those who communicate clearly the why before the how, listen to resistance without dismissing it, and understand that organizational trust is not built by the leader alone toward the team: it is a mutual support network woven across all levels of the organization, especially in times of uncertainty and accelerated change. Digital transformation is, at its core, a collective project.',
      ],
      pull: 'Healthy technological adoption requires trust. And trust is not installed with technology. It is built with leadership and sustained with reciprocity.',
    },
    {
      n: 'X', title: 'Technology must expand opportunities, not deepen inequalities.',
      body: [
        'Technological development has a structural tendency that must be countered: that of concentrating its benefits among those who already possess capital, access, and knowledge, and its costs among those who lack them.',
        'Building inclusive teams, designing accessible tools, and reducing gaps are acts of coherence with a business project that proclaims itself responsible.',
      ],
      pull: 'Digital inclusion is not access to tools. It is access to understanding, participation, and opportunity.',
    },
    {
      n: 'XI', title: 'Well-led technological transformation strengthens organizational identity.',
      body: [
        'There is a legitimate fear facing digital transformation: that incorporating technology will erode the culture or service style that constitutes the identity of the organization.',
        'When transformation is well led, exactly the opposite occurs: technology frees people from the tasks that do not define them, so they can devote greater intensity to those that do.',
      ],
      pull: 'Adopting technology is not losing identity. It is enhancing the best of an organization with new capabilities.',
    },
    {
      n: 'XII', title: 'The future is not AI or humans. It is humanity empowered by technology.',
      body: [
        'Technology and artificial intelligence are instruments: powerful, accelerating, transformative — based on the human decisions that design, implement, and direct them.',
        'The most important question is not whether artificial intelligence will replace people. It is what kind of people, leaders, and organizations we want to be in an era where our capabilities can be expanded by technology. The Fourth Impact proposes that organizations use AI to help but not govern, where data guides but does not dehumanize; where efficiency matters but not more than wellbeing; and where people are valued not only for what they produce, but for who they are and the human quality with which they inhabit their roles.',
      ],
      pull: 'The future will not simply be digital. It will be human or it will not truly be the future.',
    },
    {
      n: 'XIII', title: 'Data confidentiality is a human right, not a technical option.',
      body: [
        "Organizations that operate with people's data assume a responsibility that goes beyond legal compliance. Data is assets that contain stories, vulnerabilities, decisions, and connections of real people.",
        'An organization committed to the Fourth Impact protects data with the same judgment it would apply to any other fundamental right, because it understands the ethical weight of what it holds.',
      ],
      pull: "Organizations that use people's data have the obligation to protect it, explain its use, and ensure it is never an instrument of violation.",
    },
    {
      n: 'XIV', title: 'Technology must operate within the limits of the planet, not at its expense.',
      body: [
        'Digital transformation has an environmental dimension that few organizations measure and even fewer manage: the energy consumption of data centers, the accelerated obsolescence of devices, the carbon footprint of large-scale artificial intelligence models. Ignoring that impact only makes it invisible.',
        'A Fourth Impact organization understands that using technology responsibly also means questioning its environmental cost. It is not about renouncing innovation, but about ensuring that digital progress does not advance at the expense of the planet that sustains it. Technological efficiency and environmental sustainability, when designed together, enhance each other.',
      ],
      pull: 'The intelligent organization does not only measure what it produces. It also measures what it consumes, what it emits, and what it leaves behind.',
    },
  ],
  closingTitle: 'FINAL DECLARATION',
  closingSub: 'A call to build organizations that deserve the future they claim to want.',
  closingParas: [
    'The Fourth Impact is not a manifesto against technology. It is a manifesto about the responsibility that comes with it. About the difference between using the power that artificial intelligence confers consciously or unreflectively.',
    'The triple impact taught us that an organization cannot grow ignoring society, the environment, or economic sustainability. The Fourth Impact completes that vision for our time. Because nowadays an organization must also account for the way it uses technology, data, automation, and artificial intelligence.',
    'Artificial intelligence can be a threat when used without judgment. It can be a fad when used without strategy. But it can also be an extraordinary ally when integrated with responsibility, efficiency, and wellbeing.',
  ],
  callLines: [
    'Let us be four-impact organizations.',
    'Organizations that generate economic value.',
    'Organizations that elevate people.',
    'Organizations that care for the planet.',
    'Organizations that use technology with conscience.',
  ],
  callLines2: [
    'Let us be Fourth Impact leaders.',
    'Not to adapt to the future in any way we can.',
    'But to design it responsibly.',
  ],
  authorBlock: [
    'Paula Monte',
    'Entrepreneur · Speaker · Creator of The Fourth Impact',
    'PM Consultora Empresarial · elcuartoimpacto.com',
    'Córdoba, Argentina — May 2025',
  ],
};

// =======================================================================
// Helper paragraph builders
// =======================================================================
const P = (text, opts = {}) => new Paragraph({
  alignment: opts.align || AlignmentType.JUSTIFIED,
  spacing: { before: opts.before ?? 0, after: opts.after ?? 200, line: 320 },
  children: [new TextRun({
    text, font: opts.font || 'Calibri', size: opts.size || 22,
    color: opts.color || INK, bold: opts.bold, italics: opts.italics,
  })],
});

const H1 = (text, color = NAVY) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, font: 'Cambria', size: 96, color, bold: true })],
});

const H2 = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 400 },
  children: [new TextRun({ text, font: 'Calibri', size: 24, color: NAVY_MID, bold: true, allCaps: true })],
});

const EYEBROW = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, font: 'Calibri', size: 18, color: GOLD, bold: true, characterSpacing: 80 })],
});

const SUB = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 400 },
  children: [new TextRun({ text, font: 'Cambria', size: 28, italics: true, color: NAVY_MID })],
});

const SECTION_TITLE = (label, title) => [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 100 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLDB, space: 12 } },
    children: [new TextRun({ text: label, font: 'Calibri', size: 18, color: GOLD, bold: true, characterSpacing: 100 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: title, font: 'Cambria', size: 32, italics: true, color: NAVY })],
  }),
];

const ROMAN = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 400, after: 100 },
  children: [new TextRun({ text, font: 'Cambria', size: 60, color: GOLDB, bold: true })],
});

const PRINCIPLE_TITLE = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 300 },
  children: [new TextRun({ text, font: 'Cambria', size: 32, color: NAVY, bold: true })],
});

const PULL = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 300, after: 300, line: 360 },
  border: {
    left: { style: BorderStyle.SINGLE, size: 18, color: GOLDB, space: 16 },
  },
  indent: { left: 720, right: 720 },
  children: [new TextRun({ text, font: 'Cambria', size: 26, italics: true, color: NAVY_MID })],
});

const CENTER = (text, opts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: 320 },
  children: [new TextRun({
    text, font: opts.font || 'Calibri', size: opts.size || 22,
    color: opts.color || INK, bold: opts.bold, italics: opts.italics,
  })],
});

const HR = () => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 200 },
  children: [new TextRun({ text: '◆ ◆ ◆', font: 'Calibri', size: 18, color: GOLDB })],
});

// =======================================================================
// Build a complete document for one language
// =======================================================================
function buildDoc(data) {
  const children = [];

  // ============ COVER ============
  children.push(new Paragraph({ children: [], spacing: { before: 1200 } }));
  children.push(EYEBROW(data.brand));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 0 },
    children: [new TextRun({ text: data.title1, font: 'Cambria', size: 130, color: NAVY, bold: true, italics: true })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
    children: [new TextRun({ text: data.title2, font: 'Cambria', size: 130, color: NAVY, bold: true, italics: true })],
  }));
  // Decorative golden bar
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 24, color: GOLDB, space: 1 } },
    children: [new TextRun({ text: '', size: 2 })],
  }));
  children.push(SUB(data.subtitle));

  // Dimensions
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 80 },
    children: data.dimensions.slice(0, 3).flatMap((d, i) => {
      const arr = [new TextRun({ text: d, font: 'Calibri', size: 22, color: MUTED, bold: true })];
      if (i < 2) arr.push(new TextRun({ text: '   ·   ', font: 'Calibri', size: 22, color: GOLD }));
      return arr;
    }),
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 800 },
    children: [new TextRun({ text: data.dimensions[3], font: 'Cambria', size: 28, color: GOLDB, bold: true, italics: true })],
  }));

  children.push(new Paragraph({ children: [], spacing: { before: 1200 } }));
  children.push(CENTER(data.authorLine, { font: 'Calibri', size: 24, color: NAVY, bold: true }));
  children.push(CENTER(data.authorRole, { font: 'Cambria', size: 22, italics: true, color: MUTED }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ FOUNDATION ============
  children.push(...SECTION_TITLE(data.foundationTitle, ''));
  for (const p of data.foundationParas) children.push(P(p, { after: 220 }));
  children.push(PULL(data.foundationLead));
  children.push(P(data.foundationClose, { after: 300 }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ PRINCIPLES ============
  children.push(EYEBROW(data.principlesTitle));
  children.push(SUB(data.principlesSub));
  children.push(HR());

  for (let i = 0; i < data.principles.length; i++) {
    const pr = data.principles[i];
    children.push(ROMAN(pr.n));
    children.push(PRINCIPLE_TITLE(pr.title));
    for (const para of pr.body) children.push(P(para, { after: 220 }));
    children.push(PULL(pr.pull));
    if (i < data.principles.length - 1) children.push(HR());
    // Page break every 3 principles for readability
    if ((i + 1) % 3 === 0 && i < data.principles.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ============ FINAL DECLARATION ============
  children.push(...SECTION_TITLE(data.closingTitle, data.closingSub));
  for (const p of data.closingParas) children.push(P(p, { after: 240 }));
  children.push(HR());

  for (const l of data.callLines) children.push(CENTER(l, { font: 'Cambria', size: 28, italics: true, color: NAVY, after: 100 }));
  children.push(new Paragraph({ children: [], spacing: { before: 200 } }));
  for (const l of data.callLines2) children.push(CENTER(l, { font: 'Cambria', size: 28, italics: true, color: GOLD, bold: true, after: 100 }));

  children.push(new Paragraph({ children: [], spacing: { before: 600 } }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 400 },
    border: { top: { style: BorderStyle.SINGLE, size: 12, color: GOLDB, space: 1 } },
    children: [new TextRun({ text: '', size: 2 })],
  }));

  for (const l of data.authorBlock) {
    const isFirst = l === data.authorBlock[0];
    children.push(CENTER(l, {
      font: isFirst ? 'Cambria' : 'Calibri',
      size: isFirst ? 36 : 20,
      bold: isFirst,
      italics: isFirst,
      color: isFirst ? NAVY : MUTED,
      after: isFirst ? 100 : 80,
    }));
  }

  return new Document({
    creator: 'Paula Monte',
    title: data.brand,
    description: data.subtitle,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1800, right: 1700, bottom: 1800, left: 1700 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: data.brand + '  ·  Manifiesto VF26', font: 'Calibri', size: 16, color: MUTED, characterSpacing: 60 })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'elcuartoimpacto.com', font: 'Calibri', size: 16, color: NAVY_MID }),
              new TextRun({ text: '   ·   ', font: 'Calibri', size: 16, color: GOLD }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: MUTED }),
            ],
          })],
        }),
      },
      children,
    }],
  });
}

// =======================================================================
// Generate both files
// =======================================================================
const OUT = '/Users/paulamonte/Desktop/AGENTES IA/El cuarto Impacto/Manifiestos Oficiales';

(async () => {
  const docES = buildDoc(ES);
  const bufES = await Packer.toBuffer(docES);
  fs.writeFileSync(`${OUT}/Manifiesto_Cuarto_Impacto_VF26_ES.docx`, bufES);
  console.log('✅ ES:', bufES.length, 'bytes');

  const docEN = buildDoc(EN);
  const bufEN = await Packer.toBuffer(docEN);
  fs.writeFileSync(`${OUT}/Fourth_Impact_Manifesto_VF26_EN.docx`, bufEN);
  console.log('✅ EN:', bufEN.length, 'bytes');
})();

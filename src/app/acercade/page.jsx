'use client';

export default function AcercaDe() {
  return (
    <>
      <main class='max-w-6xl mx-auto px-4 py-12'>
        <h1 class='text-4xl font-bold mb-4'>Acerca de Ganabosques</h1>
        <p class='mb-4'>
          <strong>Ganabosques</strong> es una plataforma tecnológica diseñada
          para ayudar a Colombia en la lucha contra la deforestación asociada a
          la actividad ganadera. Su objetivo es evaluar, caracterizar y
          gestionar los niveles de riesgo de deforestación, apoyando la toma de
          decisiones de entidades públicas, gremios, productores y verificadores
          independientes.
        </p>

        <h2 class='text-2xl font-semibold mb-3'>Propósito y alcance</h2>
        <p class='mb-4'>
          El producto busca ajustar, escalar e implementar el sistema de
          información Ganabosques como herramienta para{' '}
          <strong>evaluar, caracterizar y gestionar</strong> los niveles de
          riesgo de deforestación asociados a la actividad ganadera, siguiendo
          los lineamientos del <strong>Protocolo MRV</strong> de los{' '}
          <strong>Acuerdos de Cero Deforestación (ACD)</strong>.
        </p>
        <p class='mb-4'>
          La herramienta integra información oficial del Sistema de Monitoreo de
          Bosques y Carbono (SMByC) del IDEAM, junto con datos geoespaciales y
          administrativos de predios ganaderos, registros sanitarios, ciclos de
          vacunación, trazabilidad de movilización animal y áreas protegidas.
          Con esta combinación de datos, Ganabosques calcula indicadores
          precisos de riesgo a nivel predial, territorial y empresarial.
        </p>

        <section class='md:col-span-2'>
          <h2 class='text-2xl font-semibold mb-4'>Socios estratégicos</h2>
          <p>
            Ganabosques trabaja de la mano con socios clave que aportan
            conocimiento, datos y respaldo institucional para fortalecer la
            lucha contra la deforestación. A continuación, presentamos algunas
            de las organizaciones aliadas:
          </p>
          <ul class='grid grid-cols-1 sm:grid-cols-4 gap-4 text-center items-center mt-4'>
            <li>
              <a
                href='https://www.minagricultura.gov.co/paginas/default.aspx'
                target='_blank'
                rel='noopener noreferrer'
                class='block bg-white border border-gray-300 text-gray-900 font-bold rounded-lg p-4 shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition'
              >
                Ministerio de Agricultura y Desarrollo Rural
              </a>
            </li>
            <li>
              <a
                href='https://www.ukpact.co.uk/'
                target='_blank'
                rel='noopener noreferrer'
                class='block bg-white border border-gray-300 text-gray-900 font-bold rounded-lg p-4 shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition'
              >
                UK PACT
              </a>
            </li>
            <li>
              <a
                href='https://www.cgiar.org/'
                target='_blank'
                rel='noopener noreferrer'
                class='block bg-white border border-gray-300 text-gray-900 font-bold rounded-lg p-4 shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition'
              >
                CGIAR
              </a>
            </li>
            <li>
              <a
                href='https://alliancebioversityciat.org/es'
                target='_blank'
                rel='noopener noreferrer'
                class='block bg-white border border-gray-300 text-gray-900 font-bold rounded-lg p-4 shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition'
              >
                Alliance Bioversity & CIAT
              </a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}

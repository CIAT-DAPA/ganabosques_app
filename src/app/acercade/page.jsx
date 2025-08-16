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
        <h3 class='text-2xl font-semibold mb-3'>Contribuye a</h3>
        <ul class='list-disc list-inside space-y-1 mb-4'>
          <li>
            Política Nacional de Lucha contra la Deforestación (CONPES 4021)
          </li>
          <li>Monitoreo y verificación de compromisos de Cero Deforestación</li>
          <li>Priorización de acciones y alertas tempranas</li>
        </ul>

        <section class='md:col-span-2'>
          <h2 class='text-2xl font-semibold mb-4'>Socios estratégicos</h2>
          <p>
            Ganabosques trabaja de la mano con socios clave que aportan
            conocimiento, datos y respaldo institucional para fortalecer la
            lucha contra la deforestación. A continuación, presentamos algunas
            de las organizaciones aliadas:
          </p>
          <div class='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            <div class='rounded-lg h-34 flex items-center justify-center bg-white p-2'>
              <img
                src='/partner1.png'
                alt='Socio 1'
                class='max-h-full max-w-full object-contain'
              />
            </div>
            <div class='rounded-lg h-34 flex items-center justify-center bg-white p-2'>
              <img
                src='/partner2.png'
                alt='Socio 2'
                class='max-h-full max-w-full object-contain'
              />
            </div>
            <div class='rounded-lg h-34 flex items-center justify-center bg-white p-2'>
              <img
                src='/partner3.png'
                alt='Socio 3'
                class='max-h-full max-w-full object-contain'
              />
            </div>
            <div class='rounded-lg h-34 flex items-center justify-center bg-white p-2'>
              <img
                src='/partner4.png'
                alt='Socio 4'
                class='max-h-full max-w-full object-contain'
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

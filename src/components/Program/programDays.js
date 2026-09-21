// Contenuti del calendario, trascritti da "design/Calendario sito web.ai"
// (gerarchia: giorno della settimana > orario > titolo evento > sottotitolo).
export const PROGRAM_DAYS = [
  {
    date: '2 Ottobre',
    dateNum: '02',
    weekday: 'Venerdì',
    label: 'Apertura & Esposizioni',
    entry: 'Ingresso Gratuito',
    schedule: [
      { time: '09:00', title: 'Start' },
      { time: '09:30', title: 'Pit Stop con ANM' },
      { time: '10:00', title: 'Corsi di "Guida Sicura"' },
      { time: '11:30', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
      { time: '16:00', title: 'Pit Stop' },
      {
        time: '17:00',
        title: 'Convegno',
        subtitle: 'La sicurezza stradale e la sicurezza sul lavoro',
      },
      { time: '18:30', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
    ],
  },
  {
    date: '3 Ottobre',
    dateNum: '03',
    weekday: 'Sabato',
    label: 'Show & Competizioni',
    entry: 'Ingresso Gratuito',
    schedule: [
      { time: '11:00', title: 'Start' },
      { time: '11:30', title: 'Pit Stop' },
      { time: '11:30', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
      { time: '12:30', title: 'Corso + esame "Bici Patente"' },
      { time: '16:00', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
      { time: '16:30', title: 'Pit Stop' },
      { time: '18:00', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
    ],
  },
  {
    date: '4 Ottobre',
    dateNum: '04',
    weekday: 'Domenica',
    label: 'Gran Finale',
    entry: 'Ingresso Gratuito',
    schedule: [
      { time: '11:00', title: 'Start' },
      { time: '11:30', title: 'Pit Stop' },
      { time: '11:30', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
      { time: '12:00', title: 'Parata Auto "Tour Exclusive"' },
      { time: '16:00', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
      { time: '16:30', title: 'Pit Stop' },
      { time: '18:00', title: 'Esibizione Stuntman moto, Alvaro dal Farra' },
    ],
  },
];

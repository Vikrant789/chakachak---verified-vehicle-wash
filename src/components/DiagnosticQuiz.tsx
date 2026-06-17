/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Smartphone, Flame, AlertCircle } from 'lucide-react';

interface ProblemStatement {
  id: string;
  question: string;
  impact: string;
  weight: number;
}

const PROBLEMS: ProblemStatement[] = [
  {
    id: 'proof',
    question: 'Are washes sometimes skipped with no proof or notification?',
    impact: 'You pay 100% of the cost for only 70% of the actual sessions.',
    weight: 25,
  },
  {
    id: 'marks',
    question: 'Do you notice permanent white water watermarks on the windshield or body?',
    impact: 'Hard water drying on paint etches into the clear coat, ruining the gloss.',
    weight: 20,
  },
  {
    id: 'cloth',
    question: 'Is your vehicle wiped using a dirty, grit-filled dry cloth?',
    impact: 'Grit drags across the paint, causing permanent swirl marks and micro-scratches.',
    weight: 25,
  },
  {
    id: 'coating',
    question: 'Is the cleaner unaware of ceramic coatings or paint protection films (PPF)?',
    impact: 'Incorrect chemical cleaners strips protective polymer matrices prematurely.',
    weight: 15,
  },
  {
    id: 'unreliable',
    question: 'Is there zero accountability or contact points when they miss a wash?',
    impact: 'Frustrated coordination with zero professional supervision or refunds.',
    weight: 15,
  },
];

export default function DiagnosticQuiz({ onSelectFormPlan }: { onSelectFormPlan: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  
  const handleToggle = (id: string) => {
    setSelected(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalScore = Object.entries(selected).reduce((acc, [id, val]) => {
    if (!val) return acc;
    const prob = PROBLEMS.find((p) => p.id === id);
    return acc + (prob ? prob.weight : 0);
  }, 0);

  const getVerdict = (score: number) => {
    if (score === 0) return { title: 'Optimal Care', color: 'text-green-600 bg-green-50 border-green-200', desc: 'Your current wash method is highly protective. But you can still try ChakaChak for high-fidelity photo timestamp verification.' };
    if (score <= 30) return { title: 'Moderate Risk', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', desc: 'Minor swirl-marks and missed water spot damage are starting to form. Consider switching before gloss deteriorates.' };
    if (score <= 60) return { title: 'Degrading Paint Shield', color: 'text-orange-600 bg-orange-50 border-orange-200', desc: 'Standard cleaners are scratching clear coat layers. Skipping washes costs you hundreds of rupees monthly in leaked value.' };
    return { title: 'Severe Paint Hazard', color: 'text-red-600 bg-red-50 border-red-200 font-extrabold animate-pulse', desc: 'Immediate correction needed. Severe swirl-marks and unverified payments are depleting both your vehicle and wallet.' };
  };

  const verdict = getVerdict(totalScore);

  return (
    <div id="diagnostic-quiz-block" className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-inner max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            Perform a Quick Vehicle Care Audit
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Tap the boxes pointing to problems you encounter in your daily society wash routines:
          </p>
        </div>
        
        {/* Dynamic Risk Indicator Hub */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Alert Score</span>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">{totalScore}%</span>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
            <Flame className={`w-6 h-6 ${totalScore > 50 ? 'animate-bounce text-orange-500' : ''}`} />
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {PROBLEMS.map((prob) => {
          const isActive = !!selected[prob.id];
          return (
            <button
              key={prob.id}
              onClick={() => handleToggle(prob.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                isActive
                  ? 'bg-orange-50/75 border-orange-300 shadow-sm ring-1 ring-orange-200'
                  : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                isActive ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-slate-50'
              }`}>
                {isActive && <span className="text-xs font-bold">✓</span>}
              </div>

              <div className="flex-1">
                <span className={`text-sm md:text-base font-semibold tracking-tight transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {prob.question}
                </span>
                {isActive && (
                  <p className="text-xs md:text-sm text-orange-700 mt-1 font-medium transition-opacity animate-fadeIn">
                    ⚠ {prob.impact}
                  </p>
                )}
              </div>
              <div className="text-right text-xs font-mono font-semibold text-slate-400">
                +{prob.weight}% Risk
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic Results Card */}
      <div className={`mt-6 p-5 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${verdict.color}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="text-base md:text-lg font-bold tracking-tight">
              Audit Verdict: {verdict.title}
            </h4>
          </div>
          <p className="text-xs md:text-sm leading-relaxed opacity-90">
            {verdict.desc}
          </p>
        </div>

        <button
          onClick={onSelectFormPlan}
          className="self-start md:self-center bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs md:text-sm px-5 py-3 rounded-xl transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
        >
          <Smartphone className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>Lock Pre-Launch Safety Discount</span>
        </button>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Smartphone, CheckCircle, Clock, Calendar, Star, ShieldAlert, Award, Camera, MapPin, RefreshCw } from 'lucide-react';

interface MockPhoto {
  angle: string;
  url: string;
  time: string;
  status: string;
}

const SHINE_PICS: MockPhoto[] = [
  {
    angle: 'Front View (Gloss Check)',
    url: 'Front body and bonnet sprayed with eco-polish, micro-fiber dried.',
    time: '06:14 AM',
    status: 'Clean & Inspected'
  },
  {
    angle: 'Tire & Alloys (Brake Dust)',
    url: 'Abrasive mud debris removed with PPF-safe waterless scrub.',
    time: '06:17 AM',
    status: 'Alloys Polished'
  },
  {
    angle: 'Rear & License Plate',
    url: 'Dust captured - zero water watermark streaks remaining.',
    time: '06:19 AM',
    status: 'Verified Done'
  }
];

export default function AppMockup() {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const activePhoto = SHINE_PICS[activePhotoIdx];

  const handleRate = (stars: number) => {
    setUserRating(stars);
    setRatingSubmitted(true);
    setTimeout(() => {
      setRatingSubmitted(false);
    }, 4000);
  };

  return (
    <div id="chakachak-app-mockup" className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Features and App Description */}
        <div className="lg:col-span-6 space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Smartphone className="w-3.5 h-3.5" /> Coming Soon: Mobile Companion
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tighter">
            Total Transparency, Right on Your Smartphone
          </h3>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Never guess if your vehicle was cleaned. The upcoming ChakaChak app keeps you completely in control, sending push reports as soon as the cleaner finishes.
          </p>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs md:text-sm text-slate-300">
                <strong>Multi-angle Photo Proof:</strong> Sworn image uploads verifying clean windshields, rims, and bonnet finishes daily.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs md:text-sm text-slate-300">
                <strong>Timestamp & GPS Audit:</strong> Tap logs showing the exact minute and location of wash completions.
              </p>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs md:text-sm text-slate-300">
                <strong>Fair Billing Accountance:</strong> Instantly view accumulated credits for any sickness-related skipped days. No more flat fee scams.
              </p>
            </div>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 text-xs text-sky-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Launch Day: <strong>1 August 2026</strong>. Free early access included for all pre-launch subscribers.</span>
          </div>
        </div>

        {/* Right Side: High-fidelity interactive Smartphone Frame */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-[310px] h-[550px] bg-slate-950 rounded-[40px] border-[8px] border-slate-800 shadow-3xl overflow-hidden relative flex flex-col justify-between">
            
            {/* Phone Ear Speaker / Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center">
              <div className="w-10 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Simulated App Header */}
            <div className="pt-8 px-4 pb-3 bg-gradient-to-b from-blue-900/60 to-slate-950 border-b border-white/5 flex justify-between items-center z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-[11px] font-black text-white">Chak</span>
                </div>
                <div>
                  <span className="text-[10px] block text-slate-400 font-mono tracking-wider">Apt No: 502, Wing-C</span>
                  <span className="text-xs font-bold block leading-none">Nest Society</span>
                </div>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                ● ACTIVE
              </span>
            </div>

            {/* Simulated App Body Contents */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 select-none scrollbar-none pb-4">
              
              {/* Daily Wash Proof Screen Frame */}
              <div className="bg-slate-900 rounded-2xl p-3 border border-white/5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Today's Wash Proof</span>
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-orange-400" /> Finished at 06:20 AM
                  </span>
                </div>

                {/* Simulated Swipeable Vehicle Image container */}
                <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-end p-2 pb-1.5 shadow-inner">
                  {/* Backdrop graphic representing the car part */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-90 p-4">
                    <Camera className="w-8 h-8 text-blue-500 mb-1" />
                    <span className="text-2xs font-bold text-slate-200 uppercase tracking-widest block">{activePhoto.angle}</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {activePhoto.url}
                    </span>
                  </div>

                  {/* Stamp Info overlays over actual image */}
                  <div className="z-10 bg-slate-950/80 backdrop-blur-xs p-1.5 rounded-lg border border-white/5 text-[9px] font-mono flex items-center justify-between w-full">
                    <span className="text-blue-400 font-bold flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> PUNE-C7
                    </span>
                    <span className="text-slate-400">{activePhoto.time} | 10-JUN-2026</span>
                  </div>
                </div>

                {/* Bubble pager bullets */}
                <div className="flex justify-center gap-1.5">
                  {SHINE_PICS.map((_, idx) => (
                    <button
                      key={`bullet-${idx}`}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                        activePhotoIdx === idx ? 'bg-orange-500 w-4' : 'bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Attendance Tracker calendar stripe */}
              <div className="bg-slate-900 rounded-2xl p-3 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Wash Frequency</span>
                  <span className="text-blue-400 text-[10px] font-semibold">100% Attended</span>
                </div>
                
                {/* Simulated attendance dots */}
                <div className="flex justify-between items-center gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, dIdx) => (
                    <div key={`app-day-${dIdx}`} className="flex flex-col items-center flex-1 py-1 rounded-lg bg-slate-950 border border-white/5">
                      <span className="text-[9px] text-slate-500">{day}</span>
                      <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full text-white font-extrabold text-[8px] flex items-center justify-center mt-1">
                        ✓
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer feedback interaction inside phone */}
              <div className="bg-slate-900 rounded-2xl p-3 border border-white/5 space-y-2 text-center text-xs">
                <span className="font-bold text-slate-300 block">Rate Today's Cleaning</span>
                
                {ratingSubmitted ? (
                  <div className="py-2 text-emerald-400 font-medium text-2xs flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Thanks! Audit reported to Supervisor.</span>
                  </div>
                ) : (
                  <div className="flex justify-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={`star-${stars}`}
                        onClick={() => handleRate(stars)}
                        className={`p-1 hover:scale-110 transition-transform cursor-pointer ${
                          userRating && userRating >= stars ? 'text-yellow-400' : 'text-slate-600'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-currentColor" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Phone Base Interactive Bar */}
            <div className="h-10 bg-slate-950 border-t border-white/5 flex items-center justify-center z-10">
              <div className="w-24 h-1 bg-white/40 rounded-full mb-1" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

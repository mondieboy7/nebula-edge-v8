
import React from 'react';

interface UpgradeScreenProps {
  currentPlan: string;
  onBack: () => void;
  onUpgrade: (plan: 'Starter' | 'Pro' | 'Enterprise') => void;
}

const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ currentPlan, onBack, onUpgrade }) => {
  const plans = [
    { name: 'Starter', price: '$0', features: ['Quantum Chat', 'Basic Tools', '10 Image/mo'] },
    { name: 'Pro', price: '$19', features: ['Elite Reasoning', 'Full Tool Access', 'Unlimited Images', 'Video Gen'] },
    { name: 'Enterprise', price: '$49', features: ['Custom Neural Paths', 'API Access', '24/7 Priority Genius'] }
  ];

  return (
    <div className="h-screen w-full bg-[#06071b] overflow-y-auto p-8 relative">
      <button onClick={onBack} className="absolute top-10 left-10 p-4 rounded-full glass hover:bg-white/10 text-white transition-all z-10">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div className="max-w-5xl mx-auto flex flex-col items-center pt-20 pb-20">
        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">Upgrade your Plan</h1>
        <p className="text-slate-500 font-medium mb-16">Unlock the full capacity of Nebula's intelligence.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {plans.map(plan => (
            <div key={plan.name} className={`p-8 rounded-[3rem] glass flex flex-col border-2 transition-all duration-500 ${currentPlan === plan.name ? 'border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : 'border-white/5 hover:border-white/20'}`}>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name} Plan</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">/mo</span>
                  </div>
                </div>
                {currentPlan === plan.name && (
                   <div className="bg-cyan-500 rounded-full p-1 text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                )}
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                    <span className="text-slate-300 font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onUpgrade(plan.name as any)}
                className={`w-full py-5 rounded-3xl font-black text-lg transition-all active:scale-95 ${
                  currentPlan === plan.name 
                    ? 'bg-white/5 text-slate-500 cursor-default' 
                    : 'bg-white text-black hover:bg-cyan-400'
                }`}
              >
                {currentPlan === plan.name ? 'Active Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeScreen;

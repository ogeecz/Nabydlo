
import React from 'react';
import { ProcessStage } from '../types';

interface ProcessingStepProps {
  stage: ProcessStage | null;
}

const stagesConfig = [
    { id: ProcessStage.ANALYZING, label: ProcessStage.ANALYZING, duration: '1s' },
    { id: ProcessStage.COMPOSITING, label: ProcessStage.COMPOSITING, duration: '12s' },
    { id: ProcessStage.FINALIZING, label: ProcessStage.FINALIZING, duration: '2s' }
];

const ProcessingStep: React.FC<ProcessingStepProps> = ({ stage }) => {
    const currentStageIndex = stage ? stagesConfig.findIndex(s => s.id === stage) : -1;

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-8 animate-pulse">
                AI Designér pracuje...
            </h2>
            <div className="w-full max-w-xl space-y-6">
                {stagesConfig.map((s, index) => (
                    <div key={s.id} className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2
                            ${currentStageIndex > index ? 'bg-green-500 border-green-500' : ''}
                            ${currentStageIndex === index ? 'bg-gray-800 border-purple-500 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]' : ''}
                            ${currentStageIndex < index ? 'bg-gray-800 border-gray-700' : ''}`}>
                            
                            {currentStageIndex > index && (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            )}
                            {currentStageIndex === index && (
                                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <p className={`text-lg font-medium transition-colors duration-500 ${currentStageIndex >= index ? 'text-gray-100' : 'text-gray-500'}`}>
                                {s.label}
                            </p>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
                                {currentStageIndex > index && <div className="bg-green-500 h-2 rounded-full w-full transition-all duration-500"></div>}
                                {currentStageIndex === index && 
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full animate-progress"
                                        style={{ animationDuration: s.duration }}
                                    ></div>
                                }
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation-name: progress;
                    animation-timing-function: ease-in-out;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
};

export default ProcessingStep;
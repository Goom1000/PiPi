import React, { useState, useEffect } from 'react';
import useBroadcastSync from '../../../hooks/useBroadcastSync';
import { BROADCAST_CHANNEL_NAME, ChaseOffer } from '../../../types';

// Same message types as OfferSelection
type VoteMessage =
  | { type: 'CHASE_VOTE_START'; offers: ChaseOffer[] }
  | { type: 'CHASE_VOTE_CAST'; studentName: string; offerIndex: number }
  | { type: 'CHASE_VOTE_END'; winningIndex: number };

interface VotingWidgetProps {
  studentName?: string;  // If known (from class bank)
}

const VotingWidget: React.FC<VotingWidgetProps> = ({ studentName }) => {
  const [offers, setOffers] = useState<ChaseOffer[]>([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [localName, setLocalName] = useState(studentName || '');

  const { lastMessage, postMessage } = useBroadcastSync<VoteMessage>(BROADCAST_CHANNEL_NAME);

  // Listen for vote events
  useEffect(() => {
    if (lastMessage?.type === 'CHASE_VOTE_START') {
      setOffers(lastMessage.offers);
      setIsVotingOpen(true);
      setHasVoted(false);
      setSelectedIndex(null);
      setWinningIndex(null);
    } else if (lastMessage?.type === 'CHASE_VOTE_END') {
      setIsVotingOpen(false);
      setWinningIndex(lastMessage.winningIndex);
    }
  }, [lastMessage]);

  // Cast vote
  const castVote = (index: number) => {
    if (hasVoted || !localName.trim()) return;

    setSelectedIndex(index);
    setHasVoted(true);

    postMessage({
      type: 'CHASE_VOTE_CAST',
      studentName: localName.trim(),
      offerIndex: index
    });
  };

  // Not in voting mode
  if (!isVotingOpen && winningIndex === null) {
    return null;  // Widget hidden when not voting
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      <h2 className="text-4xl font-black text-amber-400 mb-8 uppercase tracking-widest">
        {winningIndex !== null ? 'Class Chose:' : 'Vote for an Offer!'}
      </h2>

      {/* Name input if not provided */}
      {isVotingOpen && !studentName && !hasVoted && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Your name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-lg"
          />
        </div>
      )}

      {/* Offer buttons */}
      <div className="flex gap-6 max-w-4xl">
        {offers.map((offer, idx) => (
          <button
            key={idx}
            onClick={() => castVote(idx)}
            disabled={hasVoted || winningIndex !== null}
            className={`
              flex-1 p-8 rounded-2xl border-4 transition-all
              ${winningIndex === idx
                ? 'border-amber-400 bg-amber-900/50 scale-110'
                : selectedIndex === idx
                  ? 'border-green-400 bg-green-900/30'
                  : 'border-slate-600 bg-slate-800/60 hover:border-slate-500 hover:scale-105'
              }
              ${(hasVoted && selectedIndex !== idx) ? 'opacity-50' : ''}
            `}
          >
            {/* Position indicator */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
              idx === 0 ? 'bg-red-600 text-white' :
              idx === 1 ? 'bg-amber-500 text-amber-950' :
              'bg-green-600 text-white'
            }`}>
              {7 - offer.position}
            </div>

            {/* Amount */}
            <div className="text-4xl font-bold text-white text-center mb-2">
              ${offer.amount.toLocaleString()}
            </div>

            {/* Label */}
            <p className="text-slate-400 text-center text-sm">{offer.label}</p>

            {/* Selected indicator */}
            {selectedIndex === idx && (
              <div className="mt-4 text-green-400 font-bold text-center">
                ✓ Your vote
              </div>
            )}

            {/* Winner indicator */}
            {winningIndex === idx && (
              <div className="mt-4 text-amber-400 font-bold text-center animate-pulse">
                🏆 Class choice!
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Status message */}
      <p className="mt-8 text-xl text-slate-300">
        {hasVoted && isVotingOpen && 'Waiting for other votes...'}
        {winningIndex !== null && `The class chose the ${['High', 'Middle', 'Low'][winningIndex]} Offer!`}
      </p>
    </div>
  );
};

export default VotingWidget;

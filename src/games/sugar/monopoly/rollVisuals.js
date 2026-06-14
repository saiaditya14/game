export const createRollVisualTracker = () => {
  let roomId = null;
  let latestRollId = null;

  return {
    observe(nextRoom, { animateInitial = false } = {}) {
      const nextRoomId = nextRoom?.id || null;
      const nextRoll = nextRoom?.latest_roll || null;
      const nextRollId = nextRoll?.id || null;

      if (nextRoomId !== roomId) {
        roomId = nextRoomId;
        latestRollId = nextRollId;
        return animateInitial ? nextRoll : null;
      }

      if (!nextRollId || nextRollId === latestRollId) return null;

      latestRollId = nextRollId;
      return nextRoll;
    },

    reset() {
      roomId = null;
      latestRollId = null;
    },
  };
};

export const projectPlayersForTeleport = (players, roll, phase) => {
  if (!roll?.playerId || !['departing', 'arriving'].includes(phase)) return players;
  const visualPosition = phase === 'departing' ? roll.from : roll.to;
  return players.map((player) => (
    player.id === roll.playerId ? { ...player, position: visualPosition } : player
  ));
};

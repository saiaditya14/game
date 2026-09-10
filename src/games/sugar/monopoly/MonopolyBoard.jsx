import React, { useEffect, useState } from 'react';
import { BoardSpace } from './BoardSpace';
import { MonopolyDiceOverlay } from './MonopolyDiceOverlay';
import { BOARD_SPACE_COUNT, spaces } from './monopolyData';
import { projectPlayersForTeleport } from './rollVisuals';
import monopolyBoardCenterImage from '../../../../images/monopoly_board.jpeg';
export { BOARD_SPACE_COUNT, spaces };

const getPlayersByPosition = (players) => {
  return players.reduce((grouped, player) => {
    const position = Number(player.position || 0);
    const safePosition = ((position % BOARD_SPACE_COUNT) + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT;
    if (!grouped[safePosition]) grouped[safePosition] = [];
    grouped[safePosition].push(player);
    return grouped;
  }, {});
};

const getTeleportEffect = (rollId = '') => {
  const effects = ['burst', 'ring'];
  const hash = String(rollId).split('').reduce((total, character) => (
    Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0
  ), 2166136261);
  return effects[hash % effects.length];
};

const TeleportEffect = ({ effect, phase }) => (
  <span className={`monopoly-teleport-effect monopoly-teleport-${effect} is-${phase}`} aria-hidden="true">
    {[0, 1, 2, 3, 4].map((spark) => <span key={spark} />)}
  </span>
);

export const MonopolyBoard = ({
  players = [],
  diceRoll,
  movementRoll,
  ownership = {},
  canRoll = false,
  isRolling = false,
  onRoll,
  onSpaceClick,
  overlay,
}) => {
  const playerCount = Math.min(Math.max(players.length || 1, 1), 8);
  const playersById = players.reduce((map, player) => { map[player.id] = player; return map; }, {});
  const [teleport, setTeleport] = useState(null);
  const activeTeleportRoll = teleport?.roll || null;
  const teleportPhase = teleport?.phase || null;
  const teleportFromId = activeTeleportRoll ? Number(activeTeleportRoll.from || 0) % BOARD_SPACE_COUNT : null;
  const teleportToId = activeTeleportRoll ? Number(activeTeleportRoll.to || 0) % BOARD_SPACE_COUNT : null;
  const teleportEffect = getTeleportEffect(activeTeleportRoll?.id);
  const playersByPosition = getPlayersByPosition(
    projectPlayersForTeleport(players, activeTeleportRoll, teleportPhase),
  );

  useEffect(() => {
    if (!movementRoll?.id) return undefined;

    setTeleport({ roll: movementRoll, phase: 'departing' });

    const arriveId = window.setTimeout(() => {
      setTeleport((current) => (
        current?.roll.id === movementRoll.id ? { ...current, phase: 'arriving' } : current
      ));
    }, 700);
    const clearId = window.setTimeout(() => {
      setTeleport((current) => (current?.roll.id === movementRoll.id ? null : current));
    }, 1450);

    return () => {
      window.clearTimeout(arriveId);
      window.clearTimeout(clearId);
    };
  }, [movementRoll?.id]);

  return (
    <section
      className={`monopoly-board monopoly-board-players-${playerCount}`}
      aria-label="Sugaropoly board"
    >
      <div className="monopoly-grid">
        {spaces.map((space) => {
          const spacePlayers = playersByPosition[space.id] || [];
          const rawDeed = ownership[space.id] || null;
          const deed = rawDeed?.ownerId ? rawDeed : null;
          const ownerColor = deed ? playersById[deed.ownerId]?.color : null;

          return (
            <div className="monopoly-space-holder" key={space.id} style={{ gridArea: space.gridArea }}>
              <BoardSpace {...space} deed={deed} ownerColor={ownerColor} onClick={() => onSpaceClick?.(space.id)} />
              {spacePlayers.length ? (
                <div
                  className={`monopoly-token-cluster monopoly-token-cluster-${space.edge} monopoly-token-stack-${Math.min(spacePlayers.length, 8)}`}
                  aria-label={`Players on ${space.name}`}
                >
                  {spacePlayers.slice(0, 8).map((player) => {
                    const isTeleportingPlayer = activeTeleportRoll?.playerId === player.id;
                    const isDepartingToken = isTeleportingPlayer && teleportPhase === 'departing' && space.id === teleportFromId;
                    const isArrivingToken = isTeleportingPlayer && teleportPhase === 'arriving' && space.id === teleportToId;

                    return (
                      <span
                        className="monopoly-token-slot"
                        key={player.id}
                        style={{ '--player-color': player.color || '#f9a8d4' }}
                      >
                        {isDepartingToken ? <TeleportEffect effect={teleportEffect} phase="departing" /> : null}
                        <span
                          className={`monopoly-token ${isDepartingToken ? 'is-departing' : ''} ${isArrivingToken ? 'is-moving' : ''}`}
                          title={`${player.name} on ${space.name}`}
                        >
                          {String(player.name || '?').charAt(0)}
                        </span>
                        {isArrivingToken ? <TeleportEffect effect={teleportEffect} phase="arriving" /> : null}
                      </span>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="monopoly-center" style={{ gridArea: '2 / 2 / 15 / 15' }}>
          <img
            className="monopoly-center-image"
            src={monopolyBoardCenterImage}
            alt="Faerie Kingdom Quest board art"
          />
          <MonopolyDiceOverlay
            roll={diceRoll}
            canRoll={canRoll}
            isRolling={isRolling}
            onRoll={onRoll}
          />
          {overlay}
        </div>
      </div>
    </section>
  );
};

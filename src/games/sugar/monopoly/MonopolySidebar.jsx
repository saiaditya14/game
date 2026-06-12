import React, { useState } from 'react';
import {
  Crown,
  Flag,
  Gem,
  Gift,
  Heart,
  Home,
  Landmark,
  Plus,
  ScrollText,
  Sparkles,
  UserRound,
  WandSparkles,
} from 'lucide-react';

const ICONS = {
  crown: Crown,
  gem: Gem,
  gift: Gift,
  heart: Heart,
  sparkles: Sparkles,
  user: UserRound,
  wand: WandSparkles,
};

const PROPERTY_COLORS = {
  darkOlive: '#c7d99a',
  crimson: '#f9a8b7',
  darkGreen: '#a7e8b2',
  darkBlue: '#a9d7ff',
  steelGray: '#d9bf9e',
  deepViolet: '#d8c4ff',
  burntAmber: '#ffc48f',
  babyBlue: '#aee9ff',
  paleGreen: '#ffe66d',
  deepIndigo: '#b9b6ff',
  flameOrange: '#ffb48f',
  white: '#e5e7eb',
};

export const DEFAULT_PLAYERS = [
  { id: 'you', name: 'You', money: 1500, icon: 'heart', color: '#f9a8d4' },
  { id: 'partner', name: 'Partner', money: 1500, icon: 'crown', color: '#a7e8b2' },
  { id: 'fae', name: 'Moon Fae', money: 1420, icon: 'sparkles', color: '#aee9ff' },
  { id: 'mage', name: 'Berry Mage', money: 1360, icon: 'wand', color: '#d8c4ff' },
  { id: 'sprite', name: 'Sugar Sprite', money: 1280, icon: 'gem', color: '#ffe66d' },
  { id: 'duke', name: 'Candy Duke', money: 1190, icon: 'user', color: '#ffc48f' },
];

export const DEFAULT_PROPERTIES = [
  { id: 38, name: 'Faerie Haven', colorGroup: 'paleGreen', price: 300 },
  { id: 40, name: 'Elven Court', colorGroup: 'paleGreen', price: 300 },
  { id: 36, name: 'Glacier Castle', colorGroup: 'babyBlue', price: 270 },
  { id: 12, name: 'Ruby', colorGroup: 'crimson', price: 150 },
  { id: 4, name: 'Grim Burrows', colorGroup: 'darkGreen', price: 130 },
  { id: 6, name: 'Goblin Camp', colorGroup: 'darkGreen', price: 120 },
  { id: 8, name: 'Scrappy Hollow', colorGroup: 'darkGreen', price: 120 },
  { id: 10, name: 'Lava Roost', colorGroup: 'flameOrange', price: 100 },
  { id: 14, name: 'Dragon Valley', colorGroup: 'deepViolet', price: 90 },
  { id: 16, name: 'Ember Peak', colorGroup: 'deepViolet', price: 90 },
  { id: 20, name: 'Rotroot Fen', colorGroup: 'steelGray', price: 70 },
  { id: 22, name: 'Charm Chest', colorGroup: 'crimson', price: 60 },
  { id: 24, name: 'Snarl Swamp', colorGroup: 'darkOlive', price: 60 },
  { id: 30, name: 'Ancient Runes', colorGroup: 'deepIndigo', price: 260 },
  { id: 32, name: 'Winter Ridge', colorGroup: 'babyBlue', price: 270 },
];

export const DEFAULT_EVENTS = [
  { id: 'turn-8', player: 'You', action: 'bought Faerie Haven', kind: 'buy' },
  { id: 'turn-7', player: 'Moon Fae', action: 'paid $50 in moon tolls', kind: 'tax' },
  { id: 'turn-6', player: 'Partner', action: 'visited Ruby and passed through', kind: 'visit' },
  { id: 'turn-5', player: 'Berry Mage', action: 'built a tiny cottage on Glacier Castle', kind: 'build' },
  { id: 'turn-4', player: 'You', action: 'collected $200 for passing GO', kind: 'money' },
  { id: 'turn-3', player: 'Moon Fae', action: 'drew a Chance card', kind: 'card' },
  { id: 'turn-2', player: 'Partner', action: 'paid rent at Elven Court', kind: 'rent' },
  { id: 'turn-1', player: 'Berry Mage', action: 'landed on Sweet Tax', kind: 'tax' },
];

const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US')}`;

const SidebarSection = ({ title, icon: Icon, action, children, className = '' }) => (
  <section className={`monopoly-sidebar-section ${className}`}>
    <div className="monopoly-sidebar-section-header">
      <div className="monopoly-sidebar-title">
        {Icon ? <Icon className="monopoly-sidebar-title-icon" strokeWidth={2.5} /> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const MonopolySidebar = ({
  players = DEFAULT_PLAYERS.slice(0, 8),
  trades = [],
  properties = DEFAULT_PROPERTIES,
  events = DEFAULT_EVENTS,
  currentPlayerId = 'you',
  currentPlayerName,
  localPlayerId,
  localPlayerName,
  onBankruptcy,
}) => {
  const [activeLowerPanel, setActiveLowerPanel] = useState('events');
  const visiblePlayers = players.slice(0, 8);
  const isPropertiesPanelActive = activeLowerPanel === 'properties';
  const isLocalTurn = currentPlayerId && localPlayerId && currentPlayerId === localPlayerId;
  const turnName = isLocalTurn ? (localPlayerName || 'You') : currentPlayerName;

  return (
    <aside className="monopoly-sidebar" aria-label="Monopoly game sidebar">
      {turnName ? (
        <section className={`monopoly-turn-callout ${isLocalTurn ? 'is-yours' : ''}`} aria-live="polite">
          <Sparkles className="monopoly-turn-callout-icon" strokeWidth={2.5} aria-hidden="true" />
          <span>{isLocalTurn ? 'Your turn' : `${turnName}'s turn`}</span>
        </section>
      ) : null}

      <SidebarSection
        title="Players"
        icon={Crown}
        className="monopoly-players-section"
        action={
          <button className="monopoly-bankruptcy-button" type="button" onClick={onBankruptcy}>
            <Flag className="h-3.5 w-3.5" strokeWidth={2.7} />
            <span>Bankrupt</span>
          </button>
        }
      >
        <div className="monopoly-player-list" aria-label="Players and money">
          {visiblePlayers.map((player) => {
            const Icon = ICONS[player.icon] || UserRound;
            const isActive = player.id === currentPlayerId;

            return (
              <div
                className={`monopoly-player-row ${isActive ? 'is-active' : ''}`}
                key={player.id}
              >
                <div className="monopoly-player-identity">
                  <div
                    className="monopoly-player-avatar"
                    style={{ '--player-color': player.color || '#f9a8d4' }}
                  >
                    <Icon className="monopoly-player-icon" strokeWidth={2.4} />
                  </div>
                  <span className="monopoly-player-name">{player.name}</span>
                </div>
                <span className="monopoly-player-stats">
                  <span className="monopoly-player-money">{formatMoney(player.money)}</span>
                  {Number.isFinite(Number(player.position)) ? (
                    <span className="monopoly-player-position">Space {Number(player.position) + 1}</span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
      </SidebarSection>

      <SidebarSection
        title="Trades"
        icon={WandSparkles}
        action={
          <button className="monopoly-create-trade-button" type="button">
            <Plus className="h-4 w-4" strokeWidth={3} />
            <span>Create</span>
          </button>
        }
      >
        {trades.length ? (
          <div className="monopoly-trade-list">
            {trades.map((trade) => (
              <div className="monopoly-trade-row" key={trade.id}>
                <span>{trade.title}</span>
                <strong>{trade.status}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="monopoly-empty-trades">
            <Gift className="monopoly-empty-trades-icon" strokeWidth={2.3} />
            <p>Make trades with other players to exchange properties, money, and bonus cards.</p>
          </div>
        )}
      </SidebarSection>

      <SidebarSection
        title={isPropertiesPanelActive ? `My Properties (${properties.length})` : 'Event Log'}
        icon={isPropertiesPanelActive ? Gem : ScrollText}
        className="monopoly-event-section"
        action={
          <button
            className={`monopoly-property-popover-button ${isPropertiesPanelActive ? 'is-active' : ''}`}
            type="button"
            onClick={() => setActiveLowerPanel(isPropertiesPanelActive ? 'events' : 'properties')}
            aria-label={isPropertiesPanelActive ? 'Show event log' : 'Show my properties'}
            title={isPropertiesPanelActive ? 'Event log' : 'My properties'}
          >
            {isPropertiesPanelActive ? (
              <ScrollText className="h-4 w-4" strokeWidth={2.8} />
            ) : (
              <Home className="h-4 w-4" strokeWidth={2.8} />
            )}
          </button>
        }
      >
        {isPropertiesPanelActive ? (
          properties.length ? (
            <div className="monopoly-property-list" aria-label="Owned properties">
              {properties.map((property) => (
                <div className="monopoly-property-row" key={property.id}>
                  <span
                    className="monopoly-property-chip"
                    style={{ '--property-color': PROPERTY_COLORS[property.colorGroup] || '#f6c4d6' }}
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.7} />
                  </span>
                  <span className="monopoly-property-name">{property.name}</span>
                  <span className="monopoly-property-price">{formatMoney(property.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="monopoly-empty-properties">
              <Gem className="h-5 w-5" strokeWidth={2.4} />
              <span>No properties yet</span>
            </div>
          )
        ) : (
          <div className="monopoly-event-list" aria-label="Recent turn events">
            {events.map((event) => (
              <div className={`monopoly-event-row monopoly-event-${event.kind || 'visit'}`} key={event.id}>
                <span className="monopoly-event-icon">
                  <Landmark className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="monopoly-event-copy">
                  <strong>{event.player}</strong>
                  <span>{event.action}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </SidebarSection>
    </aside>
  );
};

import { useState } from 'react';
import { RIOT_REGIONS, RiotVerificationError, verifyRiotId, type PublicRiotContext, type RiotRegion } from './riotVerification';

const REGION_LABELS: Record<RiotRegion, string> = {
  americas: 'AMERICAS',
  asia: 'ASIA',
  europe: 'EUROPE',
  sea: 'SEA',
};

interface RiotVerificationPanelProps {
  context: PublicRiotContext | null;
  onVerified: (context: PublicRiotContext) => void;
}

export function RiotVerificationPanel({ context, onVerified }: RiotVerificationPanelProps) {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [platformRegion, setPlatformRegion] = useState<RiotRegion>('asia');
  const [consentToRiot, setConsentToRiot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const submit = async () => {
    if (!consentToRiot || !gameName.trim() || !tagLine.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    setIsError(false);
    try {
      const verified = await verifyRiotId({ gameName: gameName.trim(), tagLine: tagLine.trim(), platformRegion });
      onVerified(verified);
      setMessage('Riot IDを確認しました。診断スコアには影響しません。');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof RiotVerificationError ? error.message : 'Riot IDを確認できませんでした');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="riot-verification-card" aria-labelledby="riot-verification-title">
      <div className="riot-verification-card__head">
        <div><p className="eyebrow">OPTIONAL / RIOT CONTEXT</p><h2 id="riot-verification-title">Riot IDを確認する</h2></div>
        <span className="status-chip">任意</span>
      </div>
      <p className="riot-verification-card__description">経験背景の補足情報として利用します。能力値・推薦スコアは変更せず、確認しなくても診断できます。</p>
      <div className="riot-verification-form">
        <label className="field-label" htmlFor="riot-game-name">Riot ID</label>
        <input id="riot-game-name" className="text-input" value={gameName} maxLength={16} onChange={(event) => setGameName(event.target.value)} placeholder="例：Hodaka" />
        <label className="field-label" htmlFor="riot-tag-line">タグライン</label>
        <input id="riot-tag-line" className="text-input" value={tagLine} maxLength={10} onChange={(event) => setTagLine(event.target.value)} placeholder="例：JP1" />
        <label className="field-label" htmlFor="riot-region">リージョン</label>
        <select id="riot-region" className="text-input" value={platformRegion} onChange={(event) => setPlatformRegion(event.target.value as RiotRegion)}>
          {RIOT_REGIONS.map((region) => <option key={region} value={region}>{REGION_LABELS[region]}</option>)}
        </select>
      </div>
      <label className="toggle-row riot-consent-row" htmlFor="riot-consent">
        <input id="riot-consent" className="visually-hidden-control" type="checkbox" checked={consentToRiot} onChange={(event) => setConsentToRiot(event.target.checked)} />
        <span className="toggle" />
        <strong>Riot情報の取得に同意する</strong>
      </label>
      <div className="riot-verification-card__actions">
        <button className="button button--secondary" type="button" disabled={!consentToRiot || !gameName.trim() || !tagLine.trim() || busy} onClick={submit}>{busy ? '確認中…' : 'Riot IDを確認する'} <span>→</span></button>
        {context && <span className="riot-verified-label">確認済み / {REGION_LABELS[context.platformRegion]}</span>}
      </div>
      {message && <p className={`riot-verification-message ${isError ? 'is-error' : 'is-success'}`} role="status">{message}</p>}
    </section>
  );
}

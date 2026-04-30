import { CharacterType } from '../../game/Types';

export function handleHakariDomainRoll(
  dt: number,
  hakariRollTimer: number,
  hakariUsedBuffs: string[],
  setHakariState: (state: 'rolling' | 'jackpot' | null) => void,
  setHakariShowTimer: (val: number) => void,
  setHakariBuff: (buff: 'infinite_ce' | 'invulnerable' | 'mimicry') => void,
  setHakariUsedBuffs: (buffs: string[]) => void,
  playSlotRoll: () => void,
  playJackpot: () => void
): number {
  let newTimer = hakariRollTimer - dt;
  if (Math.random() > 0.95) playSlotRoll();
  if (newTimer <= 0) {
    setHakariState('jackpot');
    setHakariShowTimer(2000);
    playJackpot();
    
    const allBuffs = ['infinite_ce', 'invulnerable', 'mimicry'];
    let newUsedBuffs = [...hakariUsedBuffs];
    let chosenBuff: 'infinite_ce' | 'invulnerable' | 'mimicry';
    
    if (hakariUsedBuffs.length >= 3) {
      const rollIndex = Math.floor(Math.random() * allBuffs.length);
      chosenBuff = allBuffs[rollIndex] as 'infinite_ce' | 'invulnerable' | 'mimicry';
    } else {
      const availableBuffs = allBuffs.filter(b => !hakariUsedBuffs.includes(b));
      const rollIndex = Math.floor(Math.random() * availableBuffs.length);
      chosenBuff = availableBuffs[rollIndex] as 'infinite_ce' | 'invulnerable' | 'mimicry';
      newUsedBuffs.push(chosenBuff);
      setHakariUsedBuffs(newUsedBuffs);
    }
    
    setHakariBuff(chosenBuff);
  }
  return newTimer;
}

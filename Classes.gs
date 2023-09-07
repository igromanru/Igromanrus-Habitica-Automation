/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

class CharacterClass {
  constructor() {}

  castPrimarySkill(targetId = '') {}

  castSecondarySkill(targetId = '') {}

  castPrimaryBuff() {}

  castSecondaryBuff() {}

  castTertiaryBuff() {}
}

class Warrior extends CharacterClass {
  constructor() {
    super();
  }

  castBrutalSmash(taskId) {
    castSkill("smash", taskId);
  }
  
  castDefensiveStance() {
    castSkill("defensiveStance");
  }
  
  castValorousPresence() {
    castSkill("valorousPresence");
  }
  
  castIntimidatingGaze() {
    castSkill("intimidate");
  }

  castPrimarySkill(targetId) {
    this.castBrutalSmash(targetId);
  }

  castPrimaryBuff() {
    this.castValorousPresence();
  }

  castSecondaryBuff() {
    this.castIntimidatingGaze();
  }

  castTertiaryBuff() {
    this.castDefensiveStance();
  }
}

class Mage extends CharacterClass {
  constructor() {
    super();
  }

  castBurstOfFlames(taskId) {
    castSkill("fireball", taskId);
  }

  castEtherealSurge() {
    castSkill("mpheal");
  }

  castEarthquake() {
    castSkill("earth");
  }
  
  castChillingFrost() {
    castSkill("frost");
  }

  castPrimarySkill(targetId) {
    this.castBurstOfFlames(targetId);
  }

  castPrimaryBuff() {
    this.castEarthquake();
  }

  castSecondaryBuff() {
    this.castEtherealSurge();
  }

  castTertiaryBuff() {
    this.castChillingFrost();
  }
}

class Healer extends CharacterClass {
  constructor() {
    super();
  }

  castHealingLight() {
    castSkill("heal");
  }
  
  castSearingBrightness() {
    castSkill("protectAura");
  }
  
  castProtectiveAura() {
    castSkill("brightness");
  }
  
  castBlessing() {
    castSkill("healAll");
  }

  castPrimarySkill(targetId = '') {
    this.castHealingLight();
  }

  castSecondarySkill(targetId = '') {
    this.castBlessing();
  }

  castPrimaryBuff() {
    this.castProtectiveAura();
  }

  castSecondaryBuff() {
    this.castSearingBrightness();
  }
}

class Rogue extends CharacterClass {
  constructor() {
    super();
  }

  castPickpocket(taskId) {
    castSkill("pickPocket", taskId);
  }

  castBackstab(taskId) {
    castSkill("backStab", taskId);
  }
  
  castToolsOfTheTrade() {
    castSkill("toolsOfTrade");
  }
  
  castStealth() {
    castSkill("stealth");
  }

  castPrimarySkill(targetId = '') {
    this.castBackstab(targetId);
  }

  castSecondarySkill(targetId = '') {
    this.castPickpocket(targetId);
  }

  castPrimaryBuff() {
    this.castToolsOfTheTrade();
  }

  castSecondaryBuff() {
    this.castStealth();
  }
}
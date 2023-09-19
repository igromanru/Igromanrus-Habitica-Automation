/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

class Skill {
  constructor(spellId, skillName, manaCost, levelRequirement) {
    this._spellId = spellId;
    this._skillName = skillName;
    this._manaCost = manaCost;
    this._levelRequirement = levelRequirement;
  }

  get manaCost() {
    return this._manaCost;
  }

  get levelRequirement() {
    return this._levelRequirement;
  }

  cast(targetId = '') {
    if (typeof this._spellId === 'string' && this._spellId) {
      console.log(`Skill.cast: ${this._spellId} on "${targetId}"`);
      return castSkill(this._spellId, targetId);
    }
    return undefined;
  }
}

class ClassBase {
  constructor(user, members = []) {
    if (this.constructor == ClassBase) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this._user = user;
    this._members = members;
  }

  autoCastSkills() {
    return this._user && this._user.stats && this._user.stats.hp > 1;
  }
}

class Warrior extends ClassBase {
  constructor(user, members = []) {
    super(user, members);
    this._brutalSmash = new Skill("smash", "Brutal Smash", 10, 10);
    this._defensiveStance = new Skill("defensiveStance", "Defensive Stance", 25, 12);
    this._valorousPresence = new Skill("valorousPresence", "Valorous Presence", 20, 13);
    this._intimidatingGaze = new Skill("intimidate", "Intimidating Gaze", 15, 14);
  }

  autoCastSkills() {
    if (super.autoCastSkills()) {

    }
  }
}

class Mage extends ClassBase {
  constructor(user, members = []) {
    super(user, members);
    this._burstOfFlames = new Skill("fireball", "Burst of Flames", 10, 10);
    this._etherealSurge = new Skill("mpheal", "Ethereal Surge", 30, 12);
    this._earthquake = new Skill("earth", "Earthquake", 35, 13);
    this._chillingFrost = new Skill("frost", "Chilling Frost", 40, 14);
  }

  autoCastSkills() {
    if (super.autoCastSkills()) {
      
    }
  }
}

class Healer extends ClassBase {
  constructor(user, members = []) {
    super(user, members);
    this._healingLight = new Skill("heal", "Healing Light", 15, 10);
    this._searingBrightness = new Skill("protectAura", "Protective Aura", 15, 12);
    this._protectiveAura = new Skill("brightness", "Searing Brightness", 30, 13);
    this._blessing = new Skill("healAll", "Blessing", 25, 14);
  }

  calcBlessingHealingPower() {
    if (this._user && this._user.stats) {
      const userStats = Habitica.getUserStats(user);
      if (userStats) {
        return (userStats.int + userStats.con + 5) * 0.04;
      }
    }
    return 0;
  }

  /**
   * Returns the member with lowest HP or undefined when all members have full health
   */
  getMemberWithLowestHp() {
    let memberWithLowestHp = undefined;
    if (this._user && Array.isArray(this._members) && this._members.length > 0) {
      for (const member of this._members) {
        const membersHp = Math.ceil(member.stats.hp);
        if (member.id !== this._user.id && membersHp < member.stats.maxHealth && (memberWithLowestHp === undefined || membersHp < memberWithLowestHp.stats.hp) ) {
          memberWithLowestHp = member;
        }
      }
    }

    return memberWithLowestHp;
  }

  autoCastSkills() {
    if (super.autoCastSkills()) {
      if (AUTO_HEAL_PARTY && this._user.lvl >= this._blessing.levelRequirement && this._user.stats.mp > this._blessing.manaCost && Array.isArray(this._members) &&  this._members.length > 1) {
        const memberWithLowestHp = getMemberWithLowestHp();
        if (memberWithLowestHp) {
          const health = Math.ceil(memberWithLowestHp.stats.hp);
          const maxHealth = memberWithLowestHp.stats.maxHealth;
          const healthToHeal = maxHealth - health;
          console.log(`${arguments.callee.name}: memberWithLowestHp: ${memberWithLowestHp.profile.name} HP: ${health} To Heal: ${healthToHeal}`);
          if (healthToHeal >= HEAL_PARTY_WHEN_X_TO_HEAL) {
            const blessingPower = calcBlessingHealingPower();
            const castsCount = Math.ceil(healthToHeal / blessingPower);
            console.log(`${arguments.callee.name}: Blessing power: ${blessingPower}\nCasts count: ${castsCount}`);
            for (let i = 0; i < castsCount; i++) {
              this._blessing.cast();
            }
          }
        }
      }
      if (AUTO_HEAL_YOURSELF && this._user.lvl >= this._healingLight.levelRequirement && this._user.stats.mp > this._healingLight.manaCost) {
       
      }
    }
  }
}

class Rogue extends ClassBase {
  constructor(user, members = []) {
    super(user, members);
    this._pickPocket = new Skill("pickPocket", "Pickpocket", 10, 10);
    this._backStab = new Skill("backStab", "Backstab", 15, 12);
    this._toolsOfTrade = new Skill("toolsOfTrade", "Tools of the Trade", 25, 13);
    this._stealth = new Skill("stealth", "Stealth", 45, 14);
  }

  autoCastSkills() {
    if (super.autoCastSkills()) {
      
    }
  }
}
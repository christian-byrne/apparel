/**
 * Closest Match Input Correction Helpers.
 *
 * From: Aug 2021
 * Project: Apparel
 *
 * @exports ClosestMatch
 * @author Christian P. Byrne
 *
 */

/**
 * @class
 * @param {string[] | {[keyword: string]: string[]}} apropos
 * @param {string} fallback
 *
 */
class ClosestMatch {
  constructor(apropos, fallback) {
    // Related words to potential matches.
    this.apropros = apropos;
    this.fallback = fallback || false;

    /**
     * @public
     * @param {string} word
     * @returns {string} match
     */
    this.closestApropos = (word) => {
      let ret;
      for (const [candidate, related] of Object.entries(apropos)) {
        let relatedCopy = [...related];
        relatedCopy.push(candidate.toString());
        if (this.closestInArray(word, relatedCopy)) {
          return candidate;
        }
      }
      if (!ret) {
        return this.fallback;
      }
    };

    /**
     * @public
     * @param {string} word
     * @returns {string} match
     */
    this.getMatch = (word) => {
      let ret;
      for (const [candidate, related] of Object.entries(apropos)) {
        let relatedCopy = [...related];
        relatedCopy.push(candidate.toString());
        let result = this.closestInArray(word, relatedCopy);
        if (result) {
          return result;
        }
      }
      if (!ret) {
        return this.fallback;
      }
    };
  }

  /**
   * Get closest match from array.
   *
   * @public
   * @param {string} word
   * @param {string[]} againstArray   Apropos.
   * @param {number} errorMargin      Min letter/position differences for match.
   * @returns {string} match
   */
  closestInArray = (word, againstArray, errorMargin) => {
    errorMargin = errorMargin || Math.floor(word.length / 3);
    for (const candidate of againstArray) {
      let diff = this.calcDiff(word, candidate);
      if (diff <= errorMargin) {
        return candidate;
      }
    }
    return false;
  };

  /**
   * @private
   * @param {string} word
   * @param {string} letter
   * @returns {number}
   */
  letterCount = (word, letter) => {
    return Array.from(word).filter((x) => x == letter).length;
  };

  /**
   * @private
   * @param {string} word
   * @returns {string[]} duplicate letters.
   */
  getDuplicates = (word) => {
    let duplicates = Array.from(word).reduce(function (acc, el, i, arr) {
      if (arr.indexOf(el) !== i && acc.indexOf(el) < 0) acc.push(el);
      return acc;
    }, []);
    return duplicates;
  };

  /**
   * Return object representing each letter in word and the number
   * of occurences therein.
   *
   * @private
   * @param {string} word
   * @returns {{[letter: string]: number}}
   */
  mapLetterCts = (word) => {
    const ret = {};
    for (const letter of Array.from(word)) {
      ret[letter] = this.letterCount(word, letter);
    }
    return ret;
  };

  /**
   *
   * @param {string} word
   * @param {string} against
   * @returns {string[]} Shared letters between words.
   */
  letterIntersection = (word, against) => {
    let agArr = Array.from(against);
    return Array.from(word).filter((letter) => agArr.includes(letter));
  };

  /**
   * Difference between two words based on rating system
   * in which difference of letter and/or difference of position gives
   * one point each (can stack). Attempts to fix position of letters
   * after one mispositioned letter is found such to not over-count
   * a word with a 1-letter offset which is otherwise a match.
   *
   * @param {string} refWord
   * @param {string} againstWord
   * @returns {number} Difference between two words based on rating system
   */
  calcDiff = (refWord, againstWord) => {
    let ret = 0;
    const sharedLetters = this.letterIntersection(refWord, againstWord);
    const refLetterCts = this.mapLetterCts(refWord);
    const againstLetterCts = this.mapLetterCts(againstWord);

    // Count unique differences.
    const uniqueDiff = (letterCounts) => {
      for (const [unique, ct] of Object.entries(letterCounts)) {
        if (!sharedLetters.includes(unique)) {
          ret += ct;
        }
      }
    };
    uniqueDiff(refLetterCts);
    uniqueDiff(againstLetterCts);

    // Shallow intersection copies.
    const intersectCopy = (ogWord, intersect) => {
      let sCopy = [...ogWord].join("");
      let lettersCopy = Array.from(ogWord);
      for (const ltr of lettersCopy) {
        if (!sharedLetters.includes(ltr)) {
          sCopy = sCopy.replace(ltr, "");
        }
      }
      return Array.from(sCopy);
    };
    let adjustedWord = intersectCopy(refWord);
    let adjustedAgainst = intersectCopy(againstWord);

    for (const [shared, ct] of Object.entries(refLetterCts)) {
      // Difference in count of shared letters.
      if (sharedLetters.includes(shared)) {
        ret += Math.abs(ct - againstLetterCts[shared]);
        // Difference in position of shared letters
        if (adjustedWord.indexOf(shared) != adjustedAgainst.indexOf(shared)) {
          ret += 1;
          // Rearrange to not count all letters after as out of place as well.
          let posWord = adjustedWord.indexOf(shared);
          let posAgainst = adjustedAgainst.indexOf(shared);
          adjustedWord[posAgainst] = shared;
          adjustedWord[posWord] = adjustedAgainst[posWord];
        }
      }
    }

    return ret;
  };
}

export default ClosestMatch;

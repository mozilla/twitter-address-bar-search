/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Twitter Address Bar Search Helper Functions.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Edward Lee <edilee@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

const LANDING_PAGE = "https://twitter.com/download/firefox/welcome";
const TWITTER_ICON = "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2Fv7%2BD%2F7%2B%2Fj%2F%2B%2Fv5g%2Fv7%2BYP7%2B%2FmD%2B%2Fv5I%2Fv7%2BKP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2B%2Fv4H%2Fv7%2BUPbv4pHgx47B1K9Y3tWwWN7Ur1je3sKCx%2BrbuKj%2B%2Fv5n%2Fv7%2BGP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2B%2Fv4Y%2BfbweM2ycMe2iB7%2FvI0f%2F8STIf%2FKlyL%2FzJki%2F8yZIv%2FLmCL%2F0ahK5%2FHp1JH%2B%2Fv4Y%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A7OTTaquHN%2BCujkXPs5ZTv6N6G%2F%2B2iB7%2FxpUh%2F8yZIv%2FMmSL%2FzJki%2F8yZIv%2FKmy738OjUi%2F%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAMKtfY7w6%2BEf%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A3sqbp8iWIf%2FMmSL%2FzJki%2F8yZIv%2FMmSL%2Fy5gi%2F8mePO7%2B%2Fv4w%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2B%2Fv4H%2Fv7%2BV9CtWN3KmCL%2FzJki%2F8yZIv%2FMmSL%2FzJki%2F8yZIv%2FJlyH%2F5tSqp%2F7%2B%2FmD%2B%2Fv4%2F%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2BPXvJtGyZdXNnS%2F3y5gi%2F8qYIv%2FLmCL%2FzJki%2F8yZIv%2FMmSL%2Fy5gi%2F82iPO7LqVfe0byMmf%2F%2F%2FwD%2F%2F%2F8A%2Fv7%2BD%2FDo1JHKmy73ypci%2F8KSIP%2B%2FjyD%2FxpQh%2F8uYIv%2FMmSL%2FzJki%2F8qYIv%2B%2FjyD%2FrIEd%2F9nKqH7%2F%2F%2F8A%2F%2F%2F%2FAPPu4TzAlSz3wZEg%2F7mLH%2F%2BsgR3%2FuZdGz7mLH%2F%2FJlyH%2FzJki%2F8yZIv%2FGlSH%2Fto0r9eXbxD%2FVx6dg%2F%2F%2F%2FAP7%2B%2Fh%2Fp38WhtIsq9al%2FHP%2BkfyjuybaKgf%2F%2F%2FwCzjzjlwJAg%2F8qYIv%2FJlyH%2Fu4wf%2F8CkYrn%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwDj2sRMnHUa%2F7meYa7Vx6dg%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A2MmnYK6DHf%2B%2BjiD%2Fvo4g%2F62CHf%2Fk2sQ%2F%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A8OvhH%2Ff07w%2F%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwC%2Fp3Cfpnwc%2F66GKvPg1LZ8%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FANXHp2DJtoqByLWKgf%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F%2F%2FAP%2F%2F%2FwD%2F%2F%2F8A%2F%2F8AAP%2F%2FAADgPwAAwA8AAIAHAAB4BwAA%2BAMAAPAAAADgAQAA4AMAAMEDAADPhwAA%2F48AAP%2FnAAD%2F%2FwAA%2F%2F8AAA%3D%3D";

// Look through tabs in the browser to see if any match
function findOpenTab(browser, checkTabAndURI) {
  let foundTab;
  Array.some(browser.tabs, function(tab) {
    // Check if there's an existing page
    try {
      // Use an activate navigation if it's still loading
      let {currentURI, webNavigation, __SS_data} = tab.linkedBrowser;
      let channel = webNavigation.documentChannel;
      if (channel != null)
        currentURI = channel.originalURI

      // Use the session restore entry if it's still restoring
      if (currentURI.spec == "about:blank" && __SS_data != null)
        currentURI = Services.io.newURI(__SS_data.entries[0].url, null, null);

      // Short circuit now that we found it
      if (checkTabAndURI(tab, currentURI)) {
        foundTab = tab;
        return true;
      }
    }
    catch(ex) {}
  });
  return foundTab;
}

// Get a twitter url with a partner code
function getTwitterBase(path, from) {
  return "https://twitter.com/" + path + "?partner=mozilla&source=" +
    platform + "-" + from;
}

// Take a window and create various helper properties and functions
function makeWindowHelpers(window) {
  let {clearTimeout, setTimeout} = window;

  // Call a function after waiting a little bit
  function async(callback, delay) {
    let timer = setTimeout(function() {
      stopTimer();
      callback();
    }, delay);

    // Provide a way to stop an active timer
    function stopTimer() {
      if (timer == null)
        return;
      clearTimeout(timer);
      timer = null;
      unUnload();
    }

    // Make sure to stop the timer when unloading
    let unUnload = unload(stopTimer, window);

    // Give the caller a way to cancel the timer
    return stopTimer;
  }

  // Replace a value with another value or a function of the original value
  function change(obj, prop, val) {
    let orig = obj[prop];
    obj[prop] = typeof val == "function" ? val(orig) : val;
    unload(function() obj[prop] = orig, window);
  }

  return {
    async: async,
    change: change,
  };
}

// Convert a query to a url
function toTwitterUrl(query, from) {
  // Replace the #tag or @user with a url + referral code
  let path = encodeURIComponent(query).
    replace(/^%23/, "search/%23").replace(/^%40/, "");
  return getTwitterBase(path, from);
}

// Check if a query is a twitter-like input
function twitterLike(query) {
  return query.search(/^[@#][^ ]*$/) == 0;
}

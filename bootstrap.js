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
 * The Original Code is Twitter Address Bar Search.
 *
 * The Initial Developer of the Original Code is The Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Edward Lee <edilee@mozilla.com>
 *   Erik Vold <erikvvold@gmail.com>
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
const global = this;

const TAB_ATTR_NAME = "data-twitter";

const {classes: Cc, interfaces: Ci, manager: Cm, utils: Cu} = Components;
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

// Remember if we were just installed
let justInstalled = false;

// Remember if we're on Firefox or Fennec
let platform = Services.appinfo.name == "Firefox" ? "desktop" : "mobile";

// Add functionality to search from the location bar and hook up autocomplete
function addTwitterAddressBarSearch(window) {
  let {change} = makeWindowHelpers(window);
  let {BrowserUI, gBrowser, gURLBar} = window;

  // Check the input to see if the twitter icon should be shown
  let lastIcon = "";
  function checkInput() {
    if (skipCheck())
      return;

    // Only allow single word #tag and @user
    let icon = "";
    if (twitterLike(urlbar.value))
      icon = TWITTER_ICON;

    // Remember that the icon is showing
    lastIcon = icon;
    setIcon(icon);
  }

  // Convert to twitter urls if necessary
  function getTwitterUrl(input) {
    // Only fix up the input if we're indicating that it's a twitter term
    return lastIcon == TWITTER_ICON ? toTwitterUrl(input, "bar") : input;
  }

  // Figure out how to implement various functions depending on the platform
  let setIcon, skipCheck, urlbar;
  if (gBrowser == null) {
    setIcon = function(url) BrowserUI._updateIcon(url);
    skipCheck = function() false;
    urlbar = BrowserUI._edit;

    // Check the input on various events
    listen(window, BrowserUI._edit, "input", checkInput);

    // Convert inputs to twitter urls
    change(window.Browser, "getShortcutOrURI", function(orig) {
      return function(uri, data) {
        uri = getTwitterUrl(uri);
        return orig.call(this, uri, data);
      };
    });
  }
  else {
    setIcon = function(url) window.PageProxySetIcon(url);
    skipCheck = function() gURLBar.getAttribute("pageproxystate") == "valid" &&
                           !gURLBar.hasAttribute("focused");
    urlbar = gURLBar;

    // Check the input on various events
    listen(window, gURLBar, "input", checkInput);
    listen(window, gBrowser.tabContainer, "TabSelect", checkInput);

    // Convert inputs to twitter urls
    change(gURLBar, "_canonizeURL", function(orig) {
      return function(event) {
        this.value = getTwitterUrl(this.value);
        return orig.call(this, event);
      };
    });
  }

  // Provide a way to set the autocomplete search engines and initialize
  function setSearch(engines) {
    urlbar.setAttribute("autocompletesearch", engines);
    urlbar.mSearchNames = null;
    urlbar.initSearchNames();
  };

  // Add in the twitter search and remove on cleanup
  let origSearch = urlbar.getAttribute("autocompletesearch");
  setSearch("twitter " + origSearch);
  unload(function() setSearch(origSearch));
}

// Add an autocomplete search engine to provide location bar suggestions
function addTwitterAutocomplete() {
  const contract = "@mozilla.org/autocomplete/search;1?name=twitter";
  const desc = "Twitter Autocomplete";
  const uuid = Components.ID("42778970-8fae-454d-ad3f-eea88b945af1");

  // Keep a timer to send a delayed no match
  let timer;
  function clearTimer() {
    if (timer != null)
      timer.cancel();
    timer = null;
  }
  function setTimer(callback) {
    timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    timer.initWithCallback({
      notify: function() {
        timer = null;
        callback();
      }
    }, 1000, timer.TYPE_ONE_SHOT);
  }

  // Implement the autocomplete search that handles twitter queries
  let search = {
    createInstance: function(outer, iid) search.QueryInterface(iid),

    QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch]),

    // Handle searches from the location bar
    startSearch: function(query, param, previous, listener) {
      // Always clear the timer on a new search
      clearTimer();

      // Specially handle twitter-like queries
      if (twitterLike(query)) {
        let label;
        if (query[0] == "#")
          label = "Search for " + query;
        else
          label = "View account for " + query;

        // Call the listener immediately with one result
        listener.onSearchResult(search, {
          getCommentAt: function() "Twitter: " + query,

          getImageAt: function() TWITTER_ICON,

          getLabelAt: function() label,

          getValueAt: function() toTwitterUrl(query, "autocomplete"),

          getStyleAt: function() "favicon",

          get matchCount() 1,

          QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteResult]),

          removeValueAt: function() {},

          searchResult: Ci.nsIAutoCompleteResult.RESULT_SUCCESS,

          get searchString() query,
        });
      }
      // Send a delayed NOMATCH so the autocomplete doesn't close early
      else {
        setTimer(function() {
          listener.onSearchResult(search, {
            searchResult: Ci.nsIAutoCompleteResult.RESULT_NOMATCH,
          });
        });
      }
    },

    // Nothing to cancel other than a delayed search as results are synchronous
    stopSearch: function() {
      clearTimer();
    },
  };

  // Register this autocomplete search service and clean up when necessary
  const registrar = Ci.nsIComponentRegistrar;
  Cm.QueryInterface(registrar).registerFactory(uuid, desc, contract, search);
  unload(function() {
    Cm.QueryInterface(registrar).unregisterFactory(uuid, search);
  });
}

// Add a default search engine and move it to the right place
function addTwitterSearchEngine() {
  // Hide any existing "Twitter" searches
  let origEngine = Services.search.getEngineByName("Twitter");
  if (origEngine != null) {
    origEngine.hidden = true;
    unload(function() origEngine.hidden = false);
  }

  // Add the "Twitter " search engine if necessary
  let engineName = "Twitter ";
  try {
    Services.search.addEngineWithDetails(engineName, TWITTER_ICON, "", "",
      "GET", getTwitterBase("search/{searchTerms}", "search"));
  }
  catch(ex) {}

  // Get the just-added or existing engine
  let engine = Services.search.getEngineByName(engineName);
  if (engine == null)
    return;

  // Move it to position #2 after Google for the partner package
  Services.search.moveEngine(engine, 1);

  // Clean up when disabling
  unload(function() Services.search.removeEngine(engine));
}

// Make sure the window has an app tab set to Twitter
function ensureTwitterAppTab(window) {
  // Only bother continuing if support app tabs
  if (platform != "desktop")
    return;

  // Try again after a short delay if session store is initializing
  let {__SSi, __SS_restoreID, gBrowser, setTimeout, document, XULBrowserWindow}
      = window;
  if (__SSi == null || __SS_restoreID != null) {
    setTimeout(function() ensureTwitterAppTab(window), 1000);
    return;
  }

  function switchChrome(aDisable, aHasAttr) {
    if (!getPref("hideChromeForAppTab")) return;

    aHasAttr = aHasAttr || gBrowser.selectedTab.hasAttribute(TAB_ATTR_NAME);
    if (!aHasAttr || aDisable)
      document.documentElement.removeAttribute("disablechrome");
    else if (aHasAttr)
      document.documentElement.setAttribute("disablechrome", "true");
  };

  Services.scriptloader.loadSubScript(
      __SCRIPT_URI_SPEC__ + "/../scripts/browser.js", window);
  window.TwitterAddressBarSearch.openLocation = switchChrome.bind(null, true);
  window.TwitterAddressBarSearch.TAB_ATTR_NAME = TAB_ATTR_NAME;
  window.TwitterAddressBarSearch.getPref = getPref;

  var command = document.getElementById("Browser:OpenLocation");
  command.setAttribute("oncommand",
      "TwitterAddressBarSearch.openLocation();" + command.getAttribute("oncommand"));

  unload(function() {
    // Cleaning up the open location command modification
    command.setAttribute("oncommand",
        command.getAttribute("oncommand").replace(/TwitterAddressBarSearch.openLocation\(\);/, ""));

    delete window["TwitterAddressBarSearch"];
  });


  // Figure out if we already have a pinned twitter
  let twitterTab = findOpenTab(gBrowser, function(tab, URI) {
    return tab.pinned && URI.host == "twitter.com";
  });

  // Only add the app tab if one DNE already and the ext was just insatlled
  if (justInstalled && !twitterTab) {
    // Add the tab and pin it as the last app tab
    twitterTab = gBrowser.addTab(getTwitterBase("", "apptab"));
    gBrowser.pinTab(twitterTab);
  }

  if (twitterTab) {
    // Add attribute that'll flag this tab as the one we care about
    twitterTab.setAttribute(TAB_ATTR_NAME, "true");

    // disable chrome now if the current tab is the twitter app tab
    if (gBrowser.selectedTab.hasAttribute(TAB_ATTR_NAME)) {
      document.documentElement.setAttribute("disablechrome", "true");
    }

    // Removes the twitter tab when uninstalling
    unload(function() gBrowser.removeTab(twitterTab));
  }
}

// Open a new tab for the landing page and select it
function showLandingPage(window) {
  // Only bother if we were just installed and haven't shown yet
  if (!justInstalled || showLandingPage.shown)
    return;

  // Do the appropriate thing on each platform
  if (platform == "desktop") {
    // Try again after a short delay if session store is initializing
    let {__SSi, __SS_restoreID, gBrowser, setTimeout} = window;
    if (__SSi == null || __SS_restoreID != null) {
      setTimeout(function() showLandingPage(window), 1000);
      return;
    }

    // Figure out if we already have a landing page
    let landingTab = findOpenTab(gBrowser, function(tab, URI) {
      return URI.spec == LANDING_PAGE;
    });

    // Always remove the landing page when uninstalling
    unload(function() gBrowser.removeTab(landingTab));

    // Add the landing page if not open yet
    if (landingTab == null)
      landingTab = gBrowser.loadOneTab(LANDING_PAGE);

    // Make sure it's focused
    gBrowser.selectedTab = landingTab;
  }
  else {
    let {BrowserUI} = window;
    let tab = BrowserUI.newTab(LANDING_PAGE);
    unload(function() BrowserUI.closeTab(tab));
  }

  // Only show the landing page once
  showLandingPage.shown = true;
}

/**
 * Handle the add-on being activated on install/enable
 */
function startup({id}, reason) AddonManager.getAddonByID(id, function(addon) {
  // Load various javascript includes for helper functions
  ["prefs", "helper", "utils"].forEach(function(fileName) {
    let fileURI = addon.getResourceURI("scripts/" + fileName + ".js");
    Services.scriptloader.loadSubScript(fileURI.spec, global);
  });

  // Always set the default prefs as they disappear on restart
  setDefaultPrefs();

  // Add twitter support to the browser
  watchWindows(addTwitterAddressBarSearch);
  addTwitterAutocomplete();
  addTwitterSearchEngine();
  watchWindows(ensureTwitterAppTab);
  watchWindows(showLandingPage);

  // We're no longer just installed after we get some windows loaded
  watchWindows(function(window) {
    if (justInstalled)
      window.setTimeout(function() justInstalled = false, 5000);
  });
})

/**
 * Handle the add-on being deactivated on uninstall/disable
 */
function shutdown(data, reason) {
  // Clean up with unloaders when we're deactivating
  if (reason != APP_SHUTDOWN)
    unload();
}

/**
 * Handle the add-on being installed
 */
function install(data, reason) {
  justInstalled = reason == ADDON_INSTALL;
}

/**
 * Handle the add-on being uninstalled
 */
function uninstall(data, reason) {}

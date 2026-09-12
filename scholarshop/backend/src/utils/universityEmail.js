'use strict';

/**
 * Extract the domain part of an email (lowercased), or null if invalid.
 * @param {string} email
 * @returns {string|null}
 */
function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1);
  return domain.length > 0 ? domain : null;
}

/**
 * True if the email's domain matches one of the allowed university domains.
 * Supports exact match and subdomain match (e.g. mail.uohyd.ac.in vs uohyd.ac.in).
 * @param {string} email
 * @param {string[]} allowedDomains - e.g. ['uohyd.ac.in','example.edu']
 */
function isAllowedUniversityDomain(email, allowedDomains) {
  const domain = getEmailDomain(email);
  if (!domain || !Array.isArray(allowedDomains) || allowedDomains.length === 0) return false;
  return allowedDomains.some((d) => {
    const x = String(d).toLowerCase().trim();
    if (!x) return false;
    return domain === x || domain.endsWith(`.${x}`);
  });
}

module.exports = {
  getEmailDomain,
  isAllowedUniversityDomain,
};

const API_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('queuepro_token');
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // For FormData, remove Content-Type so browser sets it with boundary
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
      body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Network error');
    }

    return data;
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  }

  register(orgName, name, email, password) {
    return this.request('/auth/register', { method: 'POST', body: { orgName, name, email, password } });
  }

  googleAuth(credential, orgName) {
    return this.request('/auth/google', { method: 'POST', body: { credential, orgName } });
  }


  getMe() {
    return this.request('/auth/me');
  }

  // Services
  getPublicServices(orgSlug) {
    return this.request(`/services/public/${orgSlug}`);
  }

  getServices() {
    return this.request('/services');
  }

  createService(data) {
    return this.request('/services', { method: 'POST', body: data });
  }

  updateService(id, data) {
    return this.request(`/services/${id}`, { method: 'PUT', body: data });
  }

  deleteService(id) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Counters
  getCounters() {
    return this.request('/counters');
  }

  getPublicCounters(orgSlug) {
    return this.request(`/counters/public/${orgSlug}`);
  }

  createCounter(data) {
    return this.request('/counters', { method: 'POST', body: data });
  }

  updateCounter(id, data) {
    return this.request(`/counters/${id}`, { method: 'PUT', body: data });
  }

  deleteCounter(id) {
    return this.request(`/counters/${id}`, { method: 'DELETE' });
  }

  // Tickets
  createTicket(serviceId, orgSlug) {
    return this.request('/tickets', { method: 'POST', body: { serviceId, orgSlug } });
  }

  getCurrentQueue(orgSlug) {
    return this.request(`/tickets/current/${orgSlug}`);
  }

  callNext(counterId, serviceId) {
    return this.request('/tickets/call-next', { method: 'PATCH', body: { counterId, serviceId } });
  }

  recallTicket(id) {
    return this.request(`/tickets/${id}/recall`, { method: 'PATCH' });
  }

  completeTicket(id) {
    return this.request(`/tickets/${id}/complete`, { method: 'PATCH' });
  }

  skipTicket(id) {
    return this.request(`/tickets/${id}/skip`, { method: 'PATCH' });
  }

  getCounterTickets(counterId) {
    return this.request(`/tickets/counter/${counterId}`);
  }

  getStats() {
    return this.request('/tickets/stats');
  }

  resetQueue() {
    return this.request('/tickets/reset', { method: 'POST' });
  }

  // Advertisements
  getPublicAds(orgSlug) {
    return this.request(`/advertisements/public/${orgSlug}`);
  }

  getAds() {
    return this.request('/advertisements');
  }

  createAd(formData) {
    return this.request('/advertisements', {
      method: 'POST',
      body: formData,
    });
  }

  updateAd(id, data) {
    return this.request(`/advertisements/${id}`, { method: 'PUT', body: data });
  }

  deleteAd(id) {
    return this.request(`/advertisements/${id}`, { method: 'DELETE' });
  }

  // Organizations
  getOrg(slug) {
    return this.request(`/organizations/${slug}`);
  }

  updateOrgSettings(name, settings) {
    return this.request('/organizations/settings', { method: 'PATCH', body: { name, settings } });
  }

  addStaff(data) {
    return this.request('/organizations/staff', { method: 'POST', body: data });
  }

  getStaff() {
    return this.request('/organizations/staff/list');
  }

  // Master (Super Admin)
  getMasterStats() {
    return this.request('/master/stats');
  }

  getMasterOrgs() {
    return this.request('/master/organizations');
  }

  deleteMasterOrg(id) {
    return this.request(`/master/organizations/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

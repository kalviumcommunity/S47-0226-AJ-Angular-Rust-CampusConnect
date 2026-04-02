import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NavState {
  lastVisitedRoute: string;
  breadcrumbs: string[];
  activeSection: string;
}

/**
 * NavigationService — maintains shared navigation state across route changes.
 * Demonstrates that service data persists when navigating between routes.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private state: NavState = {
    lastVisitedRoute: '/',
    breadcrumbs: ['Home'],
    activeSection: 'overview'
  };

  private stateSubject = new BehaviorSubject<NavState>(this.state);
  state$ = this.stateSubject.asObservable();

  setLastVisited(route: string): void {
    this.state = { ...this.state, lastVisitedRoute: route };
    this.stateSubject.next(this.state);
  }

  setActiveSection(section: string): void {
    this.state = { ...this.state, activeSection: section };
    this.stateSubject.next(this.state);
  }

  addBreadcrumb(label: string): void {
    const crumbs = [...this.state.breadcrumbs];
    if (!crumbs.includes(label)) crumbs.push(label);
    this.state = { ...this.state, breadcrumbs: crumbs };
    this.stateSubject.next(this.state);
  }

  getState(): NavState {
    return this.state;
  }
}

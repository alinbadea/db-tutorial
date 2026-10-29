import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a menu link for each database', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne('assets/databases.json')
      .flush([
        { id: 'a', name: 'Alpha', description: '' },
        { id: 'b', name: 'Beta', description: '' },
      ]);
    await fixture.whenStable();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('header ul a');
    expect([...links].map((a) => a.textContent?.trim())).toEqual(['Alpha', 'Beta']);
  });
});

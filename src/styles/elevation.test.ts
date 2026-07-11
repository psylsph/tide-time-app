import { Platform } from 'react-native';
import { elevation } from './elevation';

// jest-expo defaults Platform.OS to 'ios', so the iOS assertions exercise the
// real code path. For Android/web we stub Platform.select to return that
// branch, decoupling the test from Platform.OS internals.
describe('elevation helper', () => {
  it('returns a non-empty style object', () => {
    const style = elevation(2);
    expect(style).toBeTruthy();
    expect(Object.keys(style).length).toBeGreaterThan(0);
  });

  it('uses an Android elevation value on Android', () => {
    jest.spyOn(Platform, 'select').mockImplementationOnce((obj: any) => obj.android);
    expect(elevation(2)).toHaveProperty('elevation', 4); // level * 2
  });

  it('honours a custom Android elevation level', () => {
    jest.spyOn(Platform, 'select').mockImplementationOnce((obj: any) => obj.android);
    expect(elevation(2, { androidLevel: 8 })).toHaveProperty('elevation', 8);
  });

  it('uses a web box-shadow on web', () => {
    jest.spyOn(Platform, 'select').mockImplementationOnce((obj: any) => obj.web);
    const style = elevation(3);
    expect(style).toHaveProperty('boxShadow');
    expect(typeof style.boxShadow).toBe('string');
    expect(style.boxShadow).toContain('rgba');
  });

  it('applies the custom opacity override on iOS shadow', () => {
    const style = elevation(3, { opacity: 0.25 }); // default Platform.OS === 'ios'
    expect(style).toHaveProperty('shadowOpacity', 0.25);
    expect(style).toHaveProperty('shadowColor', '#1E88E5');
  });

  it('uses the provided shadow colour override on iOS', () => {
    expect(elevation(2, { color: '#000000' })).toHaveProperty('shadowColor', '#000000');
  });

  it('scales the iOS shadow radius with the level', () => {
    const low = elevation(1) as { shadowRadius: number };
    const high = elevation(5) as { shadowRadius: number };
    expect(high.shadowRadius).toBeGreaterThan(low.shadowRadius);
  });
});

import axios from 'axios';
import ip from 'ip';
import path from 'path';
import request from 'supertest';
import { MockServer } from '../../../src';

export const config = () => {
  describe('Testing all Configs', () => {
    let mockServer: MockServer;

    beforeAll(async () => {
      await MockServer.Destroy();
    });
    beforeEach(() => {
      mockServer = MockServer.Create();
    });
    afterEach(async () => {
      await MockServer.Destroy();
    });
    afterAll(async () => {
      await MockServer.Destroy();
    });

    it('should start server at custom port', async () => {
      const mock = 'Working !';
      const db = { '/Hi': mock };
      mockServer.setConfig({ port: 4000 });
      await mockServer.launchServer(db);
      const response = await axios.get('http://localhost:4000/Hi');
      expect(response.data).toBe(mock);
    });

    it('should start server at custom host', async () => {
      const mock = 'Working !';
      const db = { '/Hi': mock };
      const host = ip.address();
      mockServer.setConfig({ host });
      await mockServer.launchServer(db);
      const response = await axios.get(`http://${host}:3000/Hi`);
      expect(response.data).toBe(mock);
    });

    it('should pick files relative to the root path', async () => {
      mockServer.setConfig({ root: path.join(__dirname, '../../mock') });
      await mockServer.launchServer('./db/db.json');
      const response = await request(mockServer.app).get('/post');
      expect(response.body).toEqual(require('../../mock/db/db.json')['/post'].mock);
    });

    it('should not generate db in reverse order', async () => {
      mockServer.setConfig();
      const db = {
        'post/:id': 'common post',
        'post/2': 'post 2',
        'post/1': 'post 1',
      };
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get('/post/1')).text).toBe('common post');
      expect((await request(mockServer.app).get('/post/2')).text).toBe('common post');
      expect((await request(mockServer.app).get('/post/5')).text).toBe('common post');
    });

    it('should generate db in reverse order', async () => {
      mockServer.setConfig({ reverse: true });
      const db = {
        'post/:id': 'common post',
        'post/2': 'post 2',
        'post/1': 'post 1',
      };
      await mockServer.launchServer(db);
      expect((await request(mockServer.app).get('/post/1')).text).toBe('post 1');
      expect((await request(mockServer.app).get('/post/2')).text).toBe('post 2');
      expect((await request(mockServer.app).get('/post/5')).text).toBe('common post');
    });

    it('should generate db with base url', async () => {
      mockServer.setConfig({ base: '/api' });
      const mock = 'Working !';
      const db = { '/Hi': mock };
      await mockServer.launchServer(db);
      const response1 = await request(mockServer.app).get('/Hi');
      expect(response1.statusCode).toBe(404);
      const response2 = await request(mockServer.app).get('/api/Hi');
      expect(response2.statusCode).toBe(200);
      expect(response2.text).toBe(mock);
    });

    it('should set request read only ( only GET request is allowed )', async () => {
      mockServer.setConfig({ readOnly: true });
      const mock = 'Working !';
      const db = { '/Hi': mock };
      await mockServer.launchServer(db);
      const response1 = await request(mockServer.app).post('/Hi');
      expect(response1.statusCode).toBe(403);
      expect(response1.text).toBe('Forbidden');
      const response2 = await request(mockServer.app).get('/Hi');
      expect(response2.statusCode).toBe(200);
      expect(response2.text).toBe(mock);
    });
  });
};

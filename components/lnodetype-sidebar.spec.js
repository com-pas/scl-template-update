import { expect, fixture, html } from '@open-wc/testing';
import { LNodeTypeSidebar } from './lnodetype-sidebar.js';
import { testLNodeTypesXml } from '../scl-template-update.testfiles.js';
import { getLNodeTypes } from '../foundation/utils.js';
window.customElements.define('lnodetype-sidebar', LNodeTypeSidebar);
describe('LNodeTypeSidebar filtering', () => {
    let sidebar;
    let nodes;
    beforeEach(async () => {
        const doc = new DOMParser().parseFromString(testLNodeTypesXml, 'application/xml');
        nodes = getLNodeTypes(doc);
        sidebar = await fixture(html `<lnodetype-sidebar
        .lNodeTypes=${nodes}
        .selectedId=""
      ></lnodetype-sidebar>`);
    });
    it('shows all nodes with empty filter', async () => {
        sidebar.filter = '';
        expect(sidebar.filteredLNodeTypes.length).to.equal(nodes.length);
    });
    it('filters with OR (space)', () => {
        sidebar.filter = 'foo bar';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('bar');
        expect(ids).to.include('foobar');
        expect(ids).to.include('qux');
    });
    it('filters with OR (comma)', () => {
        sidebar.filter = 'foo,bar';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('bar');
        expect(ids).to.include('foobar');
        expect(ids).to.include('qux');
    });
    it('filters with AND (ampersand)', () => {
        sidebar.filter = 'foo&bar';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foobar');
        expect(ids).to.not.include('foo');
        expect(ids).to.not.include('bar');
    });
    it('filters with AND (spaces around &)', () => {
        sidebar.filter = 'foo & bar';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foobar');
        expect(ids).to.not.include('foo');
        expect(ids).to.not.include('bar');
    });
    it('filters with mixed OR/AND', () => {
        sidebar.filter = 'foo bar&baz';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('foobar');
        expect(ids).to.include('bar');
    });
    it('filters with multiple groups', () => {
        sidebar.filter = 'foo,bar&baz,qux';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('foobar');
        expect(ids).to.include('bar');
        expect(ids).to.include('qux');
    });
    it('is case insensitive', () => {
        sidebar.filter = 'FOO';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('foobar');
    });
    it('handles leading/trailing/multiple spaces/commas', () => {
        sidebar.filter = '  foo  ,  bar  ';
        const ids = sidebar.filteredLNodeTypes.map(n => n.getAttribute('id'));
        expect(ids).to.include('foo');
        expect(ids).to.include('bar');
    });
    it('returns all nodes for nonsense filter', () => {
        sidebar.filter = '&&&';
        expect(sidebar.filteredLNodeTypes.length).to.equal(nodes.length);
    });
    it('returns no nodes for no match', () => {
        sidebar.filter = 'notfound';
        expect(sidebar.filteredLNodeTypes.length).to.equal(0);
    });
});
//# sourceMappingURL=lnodetype-sidebar.spec.js.map
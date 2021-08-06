//Connects the Gremlin Session to the "remote" Gremlin Server
//and runs this in a session instead of the default "sessionless" mode
:remote connect tinkerpop.server conf/remote.yaml session-managed
//Sets Gremlin Console into "remote" mode so that each command is run on the server
:remote console

//Remove any existing data to allow this to be rerun
g.V().drop().iterate()

oca_sb_a = g.addV('oca_sb').property('dri', 'A').property('name', 'a').next()
oca_sb_b = g.addV('oca_sb').property('dri', 'B').property('name', 'b').next()
oca_sb_c = g.addV('oca_sb').property('dri', 'C').property('name', 'c').next()
oca_sb_d = g.addV('oca_sb').property('dri', 'D').property('name', 'd').next()

attr_name = g.addV('attribute').property('name', 'name').property('type', 'Text').next()
attr_surname = g.addV('attribute').property('name', 'surname').property('type', 'Text').next()
attr_first_name = g.addV('attribute').property('name', 'first_name').property('type', 'Text').next()
attr_last_name = g.addV('attribute').property('name', 'last_name').property('type', 'Text').next()
attr_age = g.addV('attribute').property('name', 'age').property('type', 'Number').next()

datum_gender_male = g.addV('datum').property('name', 'gender').property('value', 'male').property('type', 'Text').next()
datum_gender_female = g.addV('datum').property('name', 'gender').property('value', 'female').property('type', 'Text').next()
datum_age_53 = g.addV('datum').property('name', 'age').property('value', 53).property('type', 'Number').next()
datum_age_23 = g.addV('datum').property('name', 'age').property('value', 23).property('type', 'Number').next()

entity_1 = g.addV('entity').property('id', '1').next()
entity_2 = g.addV('entity').property('id', '2').next()
entity_3 = g.addV('entity').property('id', '3').next()

g.addE('contains').property('isPII', false).from(oca_sb_a).to(attr_name).next()
g.addE('contains').property('isPII', false).from(oca_sb_a).to(attr_age).next()
g.addE('contains').property('isPII', false).from(oca_sb_b).to(attr_name).next()
g.addE('contains').property('isPII', true).from(oca_sb_b).to(attr_surname).next()
g.addE('contains').property('isPII', false).from(oca_sb_c).to(attr_first_name).next()
g.addE('contains').property('isPII', true).from(oca_sb_c).to(attr_last_name).next()
g.addE('contains').property('isPII', false).from(oca_sb_d).to(attr_first_name).next()
g.addE('contains').property('isPII', true).from(oca_sb_d).to(attr_last_name).next()
g.addE('contains').property('isPII', true).from(oca_sb_d).to(attr_age).next()

g.addE('similar_to').property('rank', 0.7f).from(attr_name).to(attr_surname).next()
g.addE('similar_to').property('rank', 0.2f).from(attr_first_name).to(attr_surname).next()
g.addE('similar_to').property('rank', 1f).from(attr_first_name).to(attr_name).next()
g.addE('similar_to').property('rank', 0.2f).from(attr_last_name).to(attr_name).next()
g.addE('similar_to').property('rank', 1f).from(attr_last_name).to(attr_surname).next()
g.addE('similar_to').property('rank', 0.2f).from(attr_last_name).to(attr_first_name).next()

g.addE('tags').from(datum_gender_male).to(oca_sb_c).next()
g.addE('tags').from(datum_gender_female).to(oca_sb_d).next()
g.addE('tags').from(datum_age_53).to(oca_sb_c).next()
g.addE('tags').from(datum_age_23).to(oca_sb_d).next()

g.addE('describes').from(datum_gender_male).to(entity_1).next()
g.addE('describes').from(datum_gender_male).to(entity_3).next()
g.addE('describes').from(datum_age_53).to(entity_1).next()
g.addE('describes').from(datum_gender_female).to(entity_2).next()
g.addE('describes').from(datum_age_23).to(entity_2).next()
g.addE('describes').from(datum_age_23).to(entity_3).next()

g.addE('owned_by').from(oca_sb_c).to(entity_1).next()
g.addE('owned_by').from(oca_sb_c).to(entity_3).next()
g.addE('owned_by').from(oca_sb_d).to(entity_2).next()
g.addE('owned_by').from(oca_sb_d).to(entity_3).next()
